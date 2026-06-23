ALTER TABLE "User"
ADD COLUMN "themeMain" TEXT NOT NULL DEFAULT '#2563eb';

ALTER TABLE "User"
ALTER COLUMN "themeBackground" SET DEFAULT '#ffffff',
ALTER COLUMN "themeAccent" SET DEFAULT '#ff6b6b',
ALTER COLUMN "themeSidebar" SET DEFAULT '#172554';

UPDATE "User"
SET
  "themeBackground" = '#ffffff',
  "themeMain" = '#2563eb',
  "themeAccent" = '#ff6b6b',
  "themeSidebar" = '#172554'
WHERE
  "themeBackground" = '#f7f4ef'
  AND "themeAccent" = '#8d718f'
  AND "themeSidebar" = '#0f1d36';
