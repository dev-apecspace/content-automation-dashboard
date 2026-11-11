-- Create video_items table (separate from content_items which only handles Facebook Posts)
-- This table handles Facebook Reels and YouTube Shorts

CREATE TABLE IF NOT EXISTS video_items (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'cho_duyet',
  idea TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  project_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Facebook Reels', 'Youtube Shorts')),
  existing_video_link TEXT,
  video_duration INTEGER DEFAULT 5,
  image_link TEXT,
  topic TEXT,
  target_audience TEXT,
  research_notes TEXT,
  expected_post_date DATE,
  posting_time TEXT,
  caption TEXT,
  call_to_action TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migrate any existing video items from content_items to video_items
INSERT INTO video_items (
  id, status, idea, project_id, project_name, platform, 
  existing_video_link, video_duration, image_link, topic, 
  target_audience, research_notes, expected_post_date, posting_time, 
  caption, call_to_action, approved_by, approved_at, published_at, 
  created_at, updated_at
)
SELECT 
  id, status, idea, project_id, project_name, platform, 
  image_link, 5, '', topic, 
  target_audience, research_notes, expected_post_date, posting_time, 
  caption, call_to_action, approved_by, approved_at, published_at, 
  created_at, updated_at
FROM content_items
WHERE platform IN ('Facebook Reels', 'Youtube Shorts')
ON CONFLICT (id) DO NOTHING;

-- Delete the migrated video items from content_items
DELETE FROM content_items WHERE platform IN ('Facebook Reels', 'Youtube Shorts');

-- Update content_items table to only allow Facebook Post
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_platform_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_platform_check CHECK (platform = 'Facebook Post');

-- Create script_scenes_video table for video scripts
CREATE TABLE IF NOT EXISTS script_scenes_video (
  id SERIAL PRIMARY KEY,
  video_item_id TEXT NOT NULL REFERENCES video_items(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  description TEXT,
  dialogue TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_items_status ON video_items(status);
CREATE INDEX IF NOT EXISTS idx_video_items_project ON video_items(project_id);
CREATE INDEX IF NOT EXISTS idx_video_items_platform ON video_items(platform);
CREATE INDEX IF NOT EXISTS idx_script_scenes_video_item ON script_scenes_video(video_item_id);
