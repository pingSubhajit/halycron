-- Create shared_links table
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  pin_hash TEXT,
  is_pin_protected BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create shared_photos junction table
CREATE TABLE IF NOT EXISTS shared_photos (
  shared_link_id UUID NOT NULL REFERENCES shared_links(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (shared_link_id, photo_id)
);

-- Create shared_albums junction table
CREATE TABLE IF NOT EXISTS shared_albums (
  shared_link_id UUID NOT NULL REFERENCES shared_links(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (shared_link_id, album_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_links(token);
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_photos_shared_link_id ON shared_photos(shared_link_id);
CREATE INDEX IF NOT EXISTS idx_shared_photos_photo_id ON shared_photos(photo_id);
CREATE INDEX IF NOT EXISTS idx_shared_albums_shared_link_id ON shared_albums(shared_link_id);
CREATE INDEX IF NOT EXISTS idx_shared_albums_album_id ON shared_albums(album_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at timestamp
CREATE TRIGGER update_shared_links_updated_at
BEFORE UPDATE ON shared_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 