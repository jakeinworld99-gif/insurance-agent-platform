-- Seed data for Insurance Agent Platform
-- Run AFTER migration 0001_init.sql

insert into public.products (code, name, type, min_age, max_age, term_years, sum_assured_inr, indicative_premium_inr) values
('TERM-10-LIFE', 'Term Life Insurance 10L', 'term', 18, 50, 10, 10000000, 12000),
('TERM-25-LIFE', 'Term Life Insurance 25L', 'term', 18, 55, 15, 25000000, 28000),
('TERM-50-LIFE', 'Term Life Insurance 50L', 'term', 18, 45, 20, 50000000, 55000),
('SAVINGS-10', 'Endowment Savings Plan 10L', 'endowment', 18, 40, 10, 10000000, 85000),
('SAVINGS-25', 'Endowment Savings Plan 25L', 'endowment', 18, 35, 15, 25000000, 180000),
('CHILD-10', 'Child Education Plan 10L', 'child', 18, 45, 15, 10000000, 65000),
('RETIRE-50', 'Pension Plan 50K/month', 'pension', 25, 45, 20, 0, 96000);
