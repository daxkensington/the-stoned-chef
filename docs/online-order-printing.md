# Square printing for Stoned Chef website orders

Prepared September 8, 2026. Online ordering remains disabled. The local changes
have not been deployed, and no physical printer has been tested.

## Website flow

The checkout already creates a Square pickup order and attaches its ID to the
Square card payment. The POS and website must use the same Square location.
The local repair blocks a payment request when Square order creation fails and
includes customer order notes in the pickup fulfillment, alongside the order
number and pickup time. Item customizations already accompany item names.

This makes the data available to Square; the POS printer profile and a physical
test determine whether the kitchen ticket prints correctly. It does not confirm
printer delivery or guarantee that a paper-out printer produced a ticket.

## Configure the existing Square printer at the truck

1. In the Square POS app, open **More > Settings > Hardware > Printers**.
2. Open **Profiles**, select the profile for the connected receipt printer, and
   open **Online and kiosk order tickets**.
3. Enable **Use this printer for online & kiosk order tickets**.
4. Enable **Automatically Print New Orders**, go back, and **Save**.
5. Check **Categories to print** includes every website item. Website items are
   currently sent without Square catalog/category IDs, so verify custom or
   uncategorized items are included on this device.
6. Keep **Single item per ticket** off for one complete kitchen ticket per order.
7. Verify the printer is connected, has paper, and prints a test ticket. Check
   that **Orders / Order Manager** is available on this POS at the website's
   Square location.

Menu labels can differ by Square device/app. Use online order tickets rather
than a ticket stub, which only identifies the order. Square documents automatic
printing when it is time to prepare the order, so a scheduled pickup may not
print immediately after checkout.

Source: [Square: Print order tickets from your point of sale](https://squareup.com/help/ca/en/article/5194-print-order-tickets).

## Validate before opening broadly

After the repair is deployed and staff are ready for a controlled reopening,
place an approved, small paid pickup order through the website. Confirm:

- The payment and pickup order appear together in the correct Square location.
- Ian receives the new-order text on his temporary owner-alert number.
- The POS receives the order and the printer produces one complete kitchen
  ticket at the expected preparation time.
- The paper shows the order/customer identifier, pickup time, all quantities,
  item customizations, and general customer notes. Do not assume fulfillment
  notes print on this hardware until checked.
- Refreshing the confirmation does not create another payment or ticket.
- Staff can recover from paper-out/disconnection and reprint the original
  ticket without placing or charging a new order. Mark intentional reprints
  clearly so the kitchen does not prepare the same order twice.

If the order reaches Square but paper does not print, investigate the POS
profile, category selection, preparation timing, and printer connection. If it
does not reach Square, inspect the website order/payment linkage and location.

## Temporary order-text recipient

Ian requested on September 9 that new-order alerts go to his cell until he
switches them to staff, using the current call-forwarding destination.
The application reads the alert recipient from `OWNER_PHONE`. Production had
no recipient configured. On September 9, this setting was populated from the
production `FORWARD_PHONE` value, and a second read verified the numbers match.
Twilio's account, token, and sending-number settings are also present.
The new recipient takes effect in the next deployment; no SMS delivery test
has been performed. Changing the forwarding number later does not automatically
change this separately configured order-alert recipient.
Do not store personal phone numbers in this document or committed source.

Owner alerts are independent of the customer's SMS opt-in. They currently
contain the order number, customer name, number of items, and total. Complete
item details remain in the order/ticket; the owner text is a short notification.
Twilio must also have its account SID, auth token, and sending number configured.

When Ian provides the staff destination, update the same `OWNER_PHONE` setting
and activate the updated deployment configuration. Verify receipt on the new
phone before relying on it. Include delivery to Ian's cell in the supervised
pickup-order test; configured credentials alone do not prove SMS delivery.

## Offline regression check

Run `node --test scripts/test-square-printing.mjs` after installing dependencies.
The tests execute the real adapter with mocked HTTP responses and Sentry. They
make no live orders or charges and require no account credentials.

Validation completed September 8: all 10 offline tests passed, TypeScript
checking passed (`tsc --noEmit --incremental false`), and ESLint passed for the
two changed server files and the regression test. Physical printing remains
unverified. Prepared from source revision
`83ef939e7db7f76029700c77c7102edb2b2500d4` on local branch
`ian/stoned-chef-online-printing-20260908`.
