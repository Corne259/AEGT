-- Fix for the energy_used column type issue
-- The error shows: invalid input syntax for type integer: "0.099"
-- This means energy_used is defined as INTEGER but should be DECIMAL

-- Connect to the database
\c aegisum_db;

-- Check current schema
\d active_mining;
\d mining_history;

-- Fix active_mining table
ALTER TABLE active_mining ALTER COLUMN energy_used TYPE DECIMAL(10,3);

-- Fix mining_history table if it exists
ALTER TABLE mining_history ALTER COLUMN energy_used TYPE DECIMAL(10,3);

-- Verify the changes
\d active_mining;
\d mining_history;

-- Show current data to verify no corruption
SELECT * FROM active_mining LIMIT 5;
SELECT * FROM mining_history LIMIT 5;

-- Success message
SELECT 'Database schema fixed successfully!' as status;