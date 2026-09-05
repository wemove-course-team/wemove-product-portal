# WEMOVE backend

## Run locally

1. Create the `wemove_portal` database with `sql/init_schema_and_data.sql`.
2. Apply `sql/migrations/20260905_add_dealer_application_user_id.sql` to an existing database.
3. Copy `.env.example` to `.env` and set the MySQL credentials.
4. Run `npm install` and `npm run start:dev`.

The API is served under `/api/v1`. Issue #90 endpoints are documented in the
repository Issue and include the authenticated application, admin review, and
dealer portal flows.
