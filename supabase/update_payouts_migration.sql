-- Update procesar_retiro_wallet function to insert requests into solicitudes_retiro
CREATE OR REPLACE FUNCTION public.procesar_retiro_wallet(p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance numeric;
  v_bank_name text;
  v_bank_account text;
  v_name_titular text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  -- Validar saldo actual y obtener datos bancarios/titular en profiles
  SELECT wallet_balance, bank_name, bank_account, name 
  INTO v_current_balance, v_bank_name, v_bank_account, v_name_titular 
  FROM public.profiles 
  WHERE id = v_user_id;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente para completar el retiro';
  END IF;

  IF v_bank_name IS NULL OR v_bank_account IS NULL THEN
    RAISE EXCEPTION 'Debes vincular una cuenta bancaria antes de poder realizar un retiro';
  END IF;

  -- Insertar transacción de retiro (monto negativo) en el ledger
  INSERT INTO public.wallet_transactions (user_id, monto, tipo, status)
  VALUES (v_user_id, -p_amount, 'retiro', 'completed');

  -- Insertar la solicitud de retiro para el proceso consolidado de Wise/pg_cron
  INSERT INTO public.solicitudes_retiro (user_id, monto, estado, banco_nombre, cuenta_numero, nombre_titular)
  VALUES (v_user_id, p_amount, 'pendiente', v_bank_name, v_bank_account, COALESCE(v_name_titular, 'Usuario Sabí'));

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;
