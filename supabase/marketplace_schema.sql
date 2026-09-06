-- =======================================================
-- SABÍ SUPER-APP: HYBRID MARKETPLACE DATABASE SCHEMA
-- =======================================================

CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('restaurant', 'botica', 'bakery', 'market', 'other')),
    persoonnummer VARCHAR(50) NOT NULL UNIQUE,
    bank_info JSONB NOT NULL,
    stripe_connect_id VARCHAR(255) NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    shop_id UUID NULL REFERENCES public.shops(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    stock INT DEFAULT 1 CHECK (stock >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    category VARCHAR(50) NOT NULL,
    images TEXT[]
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES auth.users,
    seller_id UUID NOT NULL REFERENCES auth.users,
    shop_id UUID NULL REFERENCES public.shops(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    product_price_total NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(12, 2) NOT NULL,
    order_total NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted_by_shop', 'driver_assigned', 'in_transit', 'completed', 'cancelled')),
    driver_id UUID NULL REFERENCES auth.users,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops read public" 
    ON public.shops FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Shops insert owner" 
    ON public.shops FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Shops update owner" 
    ON public.shops FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Products read public" 
    ON public.products FOR SELECT 
    USING (true);

CREATE POLICY "Products insert owner" 
    ON public.products FOR INSERT 
    WITH CHECK (
        auth.uid() = seller_id AND 
        (shop_id IS NULL OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND is_approved = true))
    );

CREATE POLICY "Products update owner" 
    ON public.products FOR UPDATE 
    USING (
        auth.uid() = seller_id AND 
        (shop_id IS NULL OR EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND is_approved = true))
    );

CREATE POLICY "Products delete owner" 
    ON public.products FOR DELETE 
    USING (
        auth.uid() = seller_id AND 
        NOT EXISTS (
            SELECT 1 FROM public.orders 
            WHERE product_id = id AND status IN ('pending', 'accepted_by_shop', 'driver_assigned', 'in_transit')
        )
    );

CREATE POLICY "Orders read participant" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR auth.uid() = driver_id);

CREATE POLICY "Orders insert authenticated" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Orders update participant" 
    ON public.orders FOR UPDATE 
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR auth.uid() = driver_id);

CREATE OR REPLACE FUNCTION public.proteger_shop_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_approved IS DISTINCT FROM NEW.is_approved THEN
        NEW.is_approved := OLD.is_approved;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_protect_shop_approval ON public.shops;
CREATE TRIGGER trigger_protect_shop_approval
    BEFORE UPDATE ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION public.proteger_shop_approval();

CREATE OR REPLACE FUNCTION public.validar_precio_orden()
RETURNS TRIGGER AS $$
DECLARE
    v_price NUMERIC(12, 2);
BEGIN
    SELECT price INTO v_price FROM public.products WHERE id = NEW.product_id;
    IF v_price IS NULL THEN
        RAISE EXCEPTION 'Product does not exist';
    END IF;
    NEW.product_price_total := v_price * NEW.quantity;
    NEW.order_total := NEW.product_price_total + NEW.delivery_fee;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_order_price ON public.orders;
CREATE TRIGGER trigger_validate_order_price
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_precio_orden();

CREATE OR REPLACE FUNCTION public.controlar_estados_orden()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF auth.uid() = OLD.seller_id THEN
            IF NOT (OLD.status = 'pending' AND NEW.status = 'accepted_by_shop') THEN
                RAISE EXCEPTION 'Sellers can only change status from pending to accepted_by_shop';
            END IF;
        END IF;
        
        IF auth.uid() = NEW.driver_id THEN
            IF NEW.status NOT IN ('driver_assigned', 'in_transit', 'completed') THEN
                RAISE EXCEPTION 'Invalid status transition for driver';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_control_order_status ON public.orders;
CREATE TRIGGER trigger_control_order_status
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.controlar_estados_orden();

CREATE OR REPLACE FUNCTION public.procesar_liquidacion_marketplace()
RETURNS TRIGGER AS $$
DECLARE
    v_seller_persoonnummer TEXT;
    v_driver_persoonnummer TEXT;
    v_sabi_comision NUMERIC(12, 2);
    v_seller_neto NUMERIC(12, 2);
    v_driver_neto NUMERIC(12, 2);
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed' OR OLD.status IS NULL) THEN
        UPDATE public.products
        SET stock = stock - NEW.quantity,
            is_available = CASE WHEN (stock - NEW.quantity) <= 0 THEN FALSE ELSE TRUE END
        WHERE id = NEW.product_id;

        IF NEW.shop_id IS NOT NULL THEN
            SELECT persoonnummer INTO v_seller_persoonnummer
            FROM public.shops
            WHERE id = NEW.shop_id;
        ELSE
            SELECT persoonnummer INTO v_seller_persoonnummer
            FROM public.profiles
            WHERE id = NEW.seller_id;
        END IF;

        IF NEW.driver_id IS NOT NULL THEN
            SELECT persoonnummer INTO v_driver_persoonnummer
            FROM public.profiles
            WHERE id = NEW.driver_id;
        END IF;

        v_sabi_comision := (NEW.product_price_total * 0.03) + (NEW.delivery_fee * 0.10);
        v_seller_neto := NEW.product_price_total * 0.97;
        v_driver_neto := NEW.delivery_fee * 0.90;

        INSERT INTO public.profiles (id, name, email, wallet_balance)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Sabí Platform', 'system@sabi.aw', 0.00)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.wallet_transactions (user_id, persoonnummer, monto, tipo, status)
        VALUES (NEW.seller_id, v_seller_persoonnummer, v_seller_neto, 'liberacion_venta', 'completed');

        IF NEW.driver_id IS NOT NULL THEN
            INSERT INTO public.wallet_transactions (user_id, persoonnummer, monto, tipo, status)
            VALUES (NEW.driver_id, v_driver_persoonnummer, v_driver_neto, 'comision_logistica', 'completed');
        END IF;

        INSERT INTO public.wallet_transactions (user_id, persoonnummer, monto, tipo, status)
        VALUES ('00000000-0000-0000-0000-000000000000', v_seller_persoonnummer, v_sabi_comision, 'comision_plataforma', 'completed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_marketplace_settlement ON public.orders;
CREATE TRIGGER trigger_process_marketplace_settlement
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.procesar_liquidacion_marketplace();
