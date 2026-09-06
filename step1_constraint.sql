-- STEP 1: Add unique constraint (idempotente, ejecutar solo una vez)
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lottery_draws_game_draw_number_draw_type_key'
  ) THEN
    ALTER TABLE public.lottery_draws
      ADD CONSTRAINT lottery_draws_game_draw_number_draw_type_key
      UNIQUE (game, draw_number, draw_type);
    RAISE NOTICE 'Constraint lottery_draws_game_draw_number_draw_type_key added';
  ELSE
    RAISE NOTICE 'Constraint already exists';
  END IF;
END $$;
COMMIT;
