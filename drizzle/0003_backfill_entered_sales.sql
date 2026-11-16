-- Days recorded before closing existed: their sales so far are the entered sales.
UPDATE "days" SET "entered_cash_sales" = "cash_sales", "entered_upi_sales" = "upi_sales"
WHERE "closed_at" IS NULL;
