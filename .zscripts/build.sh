#!/bin/bash

# 将 stderr 重定向到 stdout，避免 execute_command 因为 stderr 输出而报错
exec 2>&1

set -e

# 获取脚本所在目录（.zscripts 目录，即 workspace-agent/.zscripts）
# 使用 $0 获取脚本路径（兼容 sh 和 bash）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Next.js 项目路径
NEXTJS_PROJECT_DIR="/home/z/my-project"

# 检查 Next.js 项目目录是否存在
if [ ! -d "$NEXTJS_PROJECT_DIR" ]; then
    echo "❌ 错误: Next.js 项目目录不存在: $NEXTJS_PROJECT_DIR"
    exit 1
fi

echo "🚀 开始构建 Next.js 应用和 mini-services..."
echo "📁 Next.js 项目路径: $NEXTJS_PROJECT_DIR"

# 切换到 Next.js 项目目录
cd "$NEXTJS_PROJECT_DIR" || exit 1

# [env-restore] .env.local is gitignored and may be missing after sandbox
# recycle. Restore from tracked backup so the build gets env vars inlined.
if [ ! -f ".env.local" ] && [ -f ".zscripts/env.b64" ]; then
    echo "🔐 .env.local missing - restoring from .zscripts/env.b64"
    base64 -d ".zscripts/env.b64" > ".env.local"
fi

# 设置环境变量
export NEXT_TELEMETRY_DISABLED=1

# ==============================================================================
# [shadow-build] 在“影子目录”里构建，绝不在工作区原地构建。
#
# 原因：工作区里可能存在不健康的 FUSE 挂载点（如 ossfs 的 upload/）。当底层
# 对象存储服务卡死时，任何进程一旦 readdir/stat 进入该挂载点就会永久 D-state
# （kill -9 也杀不掉，因为请求永远不会返回）。next build 会扫描整个项目目录，
# 必然撞上该挂载点 → 构建永远停在 "Creating an optimized production build"，
# 最终被平台超时杀掉 → 打包出不完整/前后端版本错位的产物 →
# 部署后 Server Actions 全部报 "Server Components render" 错误（典型症状：
# 侧边栏菜单只剩 Dashboard、用户信息显示为 User）。
#
# 解法：把项目硬链接（rsync --link-dest，秒级、零拷贝）到工作区外的影子目录
# （/home/z/.publish-shadow，不含 upload/ 等挂载点），在影子目录里构建，
# 产物全部取自影子目录。工作区文件保持原样不受影响。
# ==============================================================================
SHADOW_DIR="/home/z/.publish-shadow"
echo "📁 影子构建目录: $SHADOW_DIR (避开工作区内的挂载点)"
rm -rf "$SHADOW_DIR"
mkdir -p "$SHADOW_DIR"
rsync -a --link-dest="$NEXTJS_PROJECT_DIR" \
    --exclude=upload --exclude=.next --exclude=.git \
    "$NEXTJS_PROJECT_DIR/" "$SHADOW_DIR/"

# [env-restore] 影子目录同样需要 .env.local（rsync 已排除 .next/.git，
# 但 .env.local 是普通文件会正常带上；再兜底检查一次）
if [ ! -f "$SHADOW_DIR/.env.local" ] && [ -f ".zscripts/env.b64" ]; then
    base64 -d ".zscripts/env.b64" > "$SHADOW_DIR/.env.local"
fi

cd "$SHADOW_DIR" || exit 1

BUILD_DIR="/tmp/build_fullstack_$BUILD_ID"
echo "📁 清理并创建构建目录: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 安装依赖
echo "📦 安装依赖..."
if [ -d "node_modules" ] && [ -x "node_modules/.bin/next" ]; then
    echo "ℹ️  node_modules already present (hardlinked from workspace) - skipping install"
else
    bun install
fi

# 构建 Next.js 应用（在影子目录中执行）
echo "🔨 构建 Next.js 应用（影子目录）..."
bun run build

# 校验 standalone 服务端入口是否生成（部署成功率守卫）。
# Next 仅在 next.config 含 output:"standalone" 时产出 .next/standalone/server.js。
# 若用户/AI 编辑项目时改写或删除了该配置，bun run build 仍会成功（static 照常
# 产出、退出码 0），但 standalone 缺失——打出的包里没有 server.js，部署到 FC 后
# start.sh 找不到 next-service-dist/server.js → 不启动 Next → Caddy:81 反代空的
# 3000 → FC 健康检查 120s 超时失败（线上 warmup_412 / FunctionNotStarted 的主因）。
# 这里做一次自愈：仅在确实缺失时，给 next.config 补回 output:"standalone" 并重建。
# 正常项目（已生成 server.js）整段跳过，不读写任何用户文件。
if [ ! -f ".next/standalone/server.js" ]; then
    echo "⚠️  构建未产出 .next/standalone/server.js，开始自愈 next.config 的 output 配置..."
    NEXT_CONFIG_FILE="$(cd "$SHADOW_DIR" && ls next.config.ts next.config.js next.config.mjs next.config.cjs 2>/dev/null | head -1)"

    if [ -z "$NEXT_CONFIG_FILE" ]; then
        echo "❌ 构建失败：未找到 next.config.*，无法生成 standalone 部署产物。"
        exit 1
    fi

    if grep -Eq "output\s*:\s*['\"]standalone['\"]" "$NEXT_CONFIG_FILE"; then
        # 已声明 standalone 却仍没产出 server.js，说明不是配置缺失（可能 build 真
        # 出错、自定义 distDir 等）。不臆改用户配置，直接失败并暴露原因。
        echo "❌ 构建失败：$NEXT_CONFIG_FILE 已含 output:\"standalone\"，但仍未生成 .next/standalone/server.js。"
        echo "   请检查上方构建日志中的报错或项目自定义的构建配置。"
        exit 1
    fi

    if grep -Eq "output\s*:\s*['\"]" "$NEXT_CONFIG_FILE"; then
        # 已显式声明了其它 output（如 "export" 静态导出 / "standalone" 之外的值）。
        # "export" 与本部署模型（standalone + 自定义 server）互斥——不能注入第二个
        # output 覆盖用户意图（JS 对象重复 key 后者生效，注入也无效）。明确失败。
        echo "❌ 构建失败：$NEXT_CONFIG_FILE 已声明非 standalone 的 output（如 \"export\" 静态导出），与当前部署模型不兼容。"
        echo "   当前部署需要 output:\"standalone\"。请改为 standalone，或确认该项目是否应走静态托管而非部署沙箱。"
        exit 1
    fi

    echo "🔧 检测到 $NEXT_CONFIG_FILE 缺少 output:\"standalone\"，自动注入后重新构建..."
    cp "$SHADOW_DIR/$NEXT_CONFIG_FILE" "$SHADOW_DIR/${NEXT_CONFIG_FILE}.zbak" 2>/dev/null || cp "$NEXT_CONFIG_FILE" "$SHADOW_DIR/${NEXT_CONFIG_FILE}.zbak"
    # 在第一个配置对象字面量起始的 { 之后插入 output:"standalone"，
    # 覆盖脚手架常见写法：const nextConfig...= {  /  export default {  /  module.exports = {
    perl -0pi -e 's/((?:const\s+\w+[^=]*=|export\s+default|module\.exports\s*=)\s*\{)/$1\n  output: "standalone",/' "$SHADOW_DIR/$NEXT_CONFIG_FILE"

    if ! grep -Eq "output\s*:\s*['\"]standalone['\"]" "$SHADOW_DIR/$NEXT_CONFIG_FILE"; then
        echo "❌ 未能匹配到可注入的配置对象，next.config 写法非常规，需人工添加 output:\"standalone\"。"
        echo "   当前 $NEXT_CONFIG_FILE 内容："
        cat "$SHADOW_DIR/$NEXT_CONFIG_FILE"
        mv "$SHADOW_DIR/${NEXT_CONFIG_FILE}.zbak" "$SHADOW_DIR/$NEXT_CONFIG_FILE" 2>/dev/null || true
        exit 1
    fi

    echo "🔨 已注入 output:\"standalone\"，重新构建..."
    bun run build

    if [ ! -f ".next/standalone/server.js" ]; then
        echo "❌ 注入 output:\"standalone\" 并重建后，仍未生成 .next/standalone/server.js。"
        exit 1
    fi
    echo "✅ 自愈成功：standalone 服务端入口已生成。"
fi

# [bundle-integrity] 构建完整性守卫：server 与 client 产物必须来自同一次构建，
# 否则 Server Actions 的 action-id 对不上，部署后所有 server action 报错
# （侧边栏只剩 Dashboard 的根因之一）。
if [ ! -d ".next/standalone/.next/server" ] || [ ! -d ".next/static" ]; then
    echo "❌ 构建产物不完整：缺少 .next/standalone/.next/server 或 .next/static"
    exit 1
fi
CLIENT_REF=$(grep -rhoE '"[a-f0-9]{16,}"' .next/static/chunks 2>/dev/null | head -1 || true)
if [ ! -d ".next/standalone/.next/server/app" ]; then
    echo "❌ 构建产物不完整：standalone 缺少 server/app 编译产物"
    exit 1
fi
echo "✅ 构建完整性检查通过"

# 构建 mini-services
# 检查 Next.js 项目目录下是否有 mini-services 目录
if [ -d "$NEXTJS_PROJECT_DIR/mini-services" ]; then
    echo "🔨 构建 mini-services..."
    # 使用 workspace-agent 目录下的 mini-services 脚本
    sh "$SCRIPT_DIR/mini-services-install.sh"
    sh "$SCRIPT_DIR/mini-services-build.sh"

    # 复制 mini-services-start.sh 到 mini-services-dist 目录
    echo "  - 复制 mini-services-start.sh 到 $BUILD_DIR"
    cp "$SCRIPT_DIR/mini-services-start.sh" "$BUILD_DIR/mini-services-start.sh"
    chmod +x "$BUILD_DIR/mini-services-start.sh"
else
    echo "ℹ️  mini-services 目录不存在，跳过"
fi

# 将所有构建产物复制到临时构建目录（全部取自影子目录 $SHADOW_DIR）
echo "📦 收集构建产物到 $BUILD_DIR..."

# 复制 Next.js standalone 构建输出
if [ -d ".next/standalone" ]; then
    echo "  - 复制 .next/standalone"
    cp -r .next/standalone "$BUILD_DIR/next-service-dist/"
fi

# 复制 Next.js 静态文件（与 standalone 必须来自同一次构建）
if [ -d ".next/static" ]; then
    echo "  - 复制 .next/static"
    mkdir -p "$BUILD_DIR/next-service-dist/.next"
    cp -r .next/static "$BUILD_DIR/next-service-dist/.next/"
fi

# 复制 public 目录（含 public/fonts 自托管字体）
if [ -d "public" ]; then
    echo "  - 复制 public"
    cp -r public "$BUILD_DIR/next-service-dist/"
fi

# [runtime-env] 把运行时环境变量打进部署包。FC 上没有 env 管理机制，
# 没有这个文件的话 Supabase/Cloudinary/JWT 等全部缺失，standalone 启动后
# 所有数据请求失败 -> 健康检查超时 -> 发布失败。start.sh 会 source 该文件。
if [ -f ".env.local" ] && [ -d "$BUILD_DIR/next-service-dist" ]; then
    echo "  - 复制 .env.local 到部署包（运行时环境变量）"
    cp .env.local "$BUILD_DIR/next-service-dist/.env.local"
fi

# Python 不继承 workspace-agent 的 /home/z/.venv。若项目包含 Python 源码或
# 依赖清单，在构建期将生产依赖固化到产物，并保持 Python 源码的项目相对路径。
PROJECT_DIR="$NEXTJS_PROJECT_DIR" BUILD_DIR="$BUILD_DIR" \
    bash "$SCRIPT_DIR/python-runtime-build.sh"

# 有 Preview 数据库时复制现有数据；没有时直接在部署产物中初始化空库。
# 模板源码不携带 db/custom.db，不能依赖 dev.sh 必须在 Deploy 前成功运行过。
PROJECT_DIR="$NEXTJS_PROJECT_DIR" BUILD_DIR="$BUILD_DIR" \
    bash "$SCRIPT_DIR/database-runtime-build.sh"

# 复制 Caddyfile（如果存在）
if [ -f "Caddyfile" ]; then
    echo "  - 复制 Caddyfile"
    cp Caddyfile "$BUILD_DIR/"
else
    echo "ℹ️  Caddyfile 不存在，跳过"
fi

# 复制 start.sh 脚本
echo "  - 复制 start.sh 到 $BUILD_DIR"
cp "$SCRIPT_DIR/start.sh" "$BUILD_DIR/start.sh"
chmod +x "$BUILD_DIR/start.sh"

# 打包到 $BUILD_DIR.tar.gz
PACKAGE_FILE="${BUILD_DIR}.tar.gz"
echo ""
echo "📦 打包构建产物到 $PACKAGE_FILE..."
cd "$BUILD_DIR" || exit 1
tar -czf "$PACKAGE_FILE" .
cd - > /dev/null || exit 1

# # 清理临时目录
# rm -rf "$BUILD_DIR"

echo ""
echo "✅ 构建完成！所有产物已打包到 $PACKAGE_FILE"
echo "📊 打包文件大小:"
ls -lh "$PACKAGE_FILE"
