-- =======================================================
-- SABÍ SUPER-APP: DEMAND ANALYTICS & WHITE LABEL TABLES
-- =======================================================

-- 1. Tabla para Órdenes de Importación de China
CREATE TABLE IF NOT EXISTS public.china_orders (
    id TEXT PRIMARY KEY, -- Usamos el tracking ID o CJ Order ID
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    price_awg NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla para Clics / Interacciones de Productos de USA
CREATE TABLE IF NOT EXISTS public.usa_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- ASIN o ID de Amazon
    product_title TEXT NOT NULL,
    price_awg NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.china_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usa_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas para china_orders
CREATE POLICY "Cualquiera puede insertar órdenes de China"
    ON public.china_orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Solo administradores ven órdenes de China"
    ON public.china_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para usa_clicks
CREATE POLICY "Cualquiera puede insertar clics de USA"
    ON public.usa_clicks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Solo administradores ven clics de USA"
    ON public.usa_clicks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Función RPC para Analíticas de Demanda Consolidadas
CREATE OR REPLACE FUNCTION public.get_sabi_demand_analytics()
RETURNS JSON SECURITY DEFINER AS $$
DECLARE
    v_marketplace_best_sellers JSON;
    v_colombia_imports JSON;
    v_china_imports JSON;
    v_usa_imports JSON;
    v_latent_demand JSON;
BEGIN
    -- A. Top 5 productos más vendidos en el Marketplace Local
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_marketplace_best_sellers FROM (
        SELECT p.title, SUM(o.quantity)::int as quantity, p.price::numeric as price_awg, SUM(o.product_price_total)::numeric as total_revenue
        FROM public.orders o
        JOIN public.products p ON o.product_id = p.id
        WHERE o.status = 'completed'
        GROUP BY p.id, p.title, p.price
        ORDER BY quantity DESC
        LIMIT 5
    ) t;

    -- B. Top 5 productos importados desde Colombia
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_colombia_imports FROM (
        SELECT sp.title, SUM(cp.quantity)::int as quantity, sp.price_venta_awg::numeric as price_awg, SUM(cp.total_awg)::numeric as total_revenue
        FROM public.colombia_preorders cp
        JOIN public.sabi_products sp ON cp.product_id = sp.id
        WHERE cp.status != 'cancelled'
        GROUP BY sp.id, sp.title, sp.price_venta_awg
        ORDER BY quantity DESC
        LIMIT 5
    ) t;

    -- C. Top 5 productos importados desde China
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_china_imports FROM (
        SELECT product_name as title, SUM(quantity)::int as quantity, AVG(price_awg)::numeric as price_awg, SUM(price_awg * quantity)::numeric as total_revenue
        FROM public.china_orders
        GROUP BY product_name
        ORDER BY quantity DESC
        LIMIT 5
    ) t;

    -- D. Top 5 productos con clics/interés desde USA
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_usa_imports FROM (
        SELECT product_title as title, COUNT(*)::int as quantity, AVG(price_awg)::numeric as price_awg, (COUNT(*) * AVG(price_awg))::numeric as total_revenue
        FROM public.usa_clicks
        GROUP BY product_id, product_title
        ORDER BY quantity DESC
        LIMIT 5
    ) t;

    -- E. Demanda Latente (Búsquedas sin conversión)
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_latent_demand FROM (
        SELECT keyword, COUNT(*)::int as total_searches
        FROM public.search_logs
        WHERE conversion_status = false
        GROUP BY keyword
        ORDER BY total_searches DESC
        LIMIT 5
    ) t;

    -- Consolidación de todas las métricas en un único JSON
    RETURN json_build_object(
        'marketplace_best_sellers', v_marketplace_best_sellers,
        'colombia_imports', v_colombia_imports,
        'china_imports', v_china_imports,
        'usa_imports', v_usa_imports,
        'latent_demand', v_latent_demand
    );
END;
$$ LANGUAGE plpgsql;
