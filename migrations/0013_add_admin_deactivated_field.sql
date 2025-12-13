-- Add admin_deactivated field to track admin-side deactivation
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS admin_deactivated BOOLEAN DEFAULT FALSE;

-- Update existing flagged surveys to be admin_deactivated
UPDATE surveys SET admin_deactivated = TRUE WHERE status = 'flagged';

