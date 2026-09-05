# WEMOVE backend

## Run locally

1. Create the `wemove_portal` database with `sql/init_schema_and_data.sql`.
2. Apply `sql/migrations/20260905_add_dealer_application_user_id.sql` to an existing database.
3. For manual Issue #90 verification, optionally run `sql/demo_users.sql`.
4. Copy `.env.example` to `.env` and set the MySQL credentials.
5. Run `npm install` and `npm run start:dev`.

The API is served under `/api/v1`. Issue #90 endpoints are documented in the
repository Issue and include the authenticated application, admin review, and
dealer portal flows.

The demo accounts use password `123456`: `admin_demo`, `user_demo`, and
`dealer_demo`. Do not use these credentials in production.
