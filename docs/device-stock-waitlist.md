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

Public onboarding reviews the locked-in application model separately from
customer-selected substitutes. The review endpoint discloses quantities and
pricing; it neither assigns hardware nor creates a charge. The payment API
rechecks the reviewed model mix and total before it creates a single physical
hold. Same-manufacturer matches come first; drop to other manufacturers only
when there is no eligible same-manufacturer option. Only paid model/quantity
lines are carried into the installation step. The unfilled quantity remains
against the original model in the existing waitlist.
