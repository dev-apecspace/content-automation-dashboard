"use client";

import { useEffect, useState, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function OAuthLogic() {
  const [status, setStatus] = useState("Đang xử lý đăng nhập...");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      // 1. Parse code from URL
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(`Lỗi từ Google: ${errorParam}`);
        return;
      }

      if (!code) {
        setError("Không tìm thấy mã xác thực.");
        return;
      }

      // 2. Retrieve credentials from storage
      const clientId = sessionStorage.getItem("oauth_client_id");
      const clientSecret = sessionStorage.getItem("oauth_client_secret");
      const redirectUri = window.location.origin + "/oauth/callback";

      if (!clientId || !clientSecret) {
        setError(
          "Không tìm thấy thông tin Client Credentials. Vui lòng thử lại từ trang setup."
        );
        return;
      }

      setStatus("Đang trao đổi token với Google...");

      try {
        // 3. Exchange code for tokens
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error_description || data.error || "Lỗi khi lấy token"
          );
        }

        // 4. Send back to opener
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "OAUTH_SUCCESS",
              payload: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
              },
            },
            window.location.origin
          );
          setStatus("Thành công! Đang đóng cửa sổ...");
          setTimeout(() => window.close(), 1000);
        } else {
          setError(
            "Không tìm thấy cửa sổ gốc. Vui lòng đóng tab này và nhập thủ công."
          );
        }
      } catch (err: any) {
        console.error(err);
        setError(`Lỗi: ${err.message}`);
      } finally {
        // Cleanup sensitive data
        sessionStorage.removeItem("oauth_client_id");
        sessionStorage.removeItem("oauth_client_secret");
      }
    }

    handleCallback();
  }, [searchParams]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
      {error ? (
        <div className="text-red-500 font-medium">{error}</div>
      ) : (
        <>
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <h1 className="text-xl font-semibold text-slate-800">
            Xác thực Google OAuth
          </h1>
          <p className="text-slate-500 text-sm">{status}</p>
        </>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Đang tải...</p>
          </div>
        }
      >
        <OAuthLogic />
      </Suspense>
    </div>
  );
}
