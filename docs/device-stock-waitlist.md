# Device stock waitlist

The platform Device Inventory keeps its existing model catalog table. Its new
summary and Stock Waitlist tab use the Auth stock APIs. Main app and public
onboarding use the same model catalog. The main app serves /stock-offer/:id
outside the tenant login flow; the token in the email link authorizes only
that one request and is sent as X-Application-Token.

The backend owns each physical unit's state. Available stock becomes held for
an exact model and order, then paid only on provider confirmation, and finally
assigned by a platform admin. Do not simulate this with browser storage or
copy the Supabase demo. The checkout amount returned by the server covers the
current batch, not the unsupplied quantities. Existing Device Requests retain
newest-first order; the Stock Waitlist is oldest first.
