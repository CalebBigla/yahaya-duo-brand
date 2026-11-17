-- Allow only owners to permanently delete expense records.
-- Apply to the live Supabase database before relying on the Expenses delete action.
DROP POLICY IF EXISTS "Owners can delete expense_transactions" ON public.expense_transactions;

CREATE POLICY "Owners can delete expense_transactions"
    ON public.expense_transactions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users
            WHERE user_id = auth.uid()
              AND role = 'owner'
        )
    );
