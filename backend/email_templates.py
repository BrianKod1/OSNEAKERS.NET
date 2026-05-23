"""HTML email templates for OSneakers transactional emails."""
from models import Order


def welcome_html(discount_code: str, discount_percent: int) -> str:
    return f"""
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;">
          <tr><td align="center">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
              <tr><td style="padding:40px 40px 24px;">
                <div style="font-size:11px;letter-spacing:3px;color:#00E5FF;font-weight:700;text-transform:uppercase;">[ WELCOME TO THE DROP ]</div>
                <h1 style="margin:16px 0 0;font-size:42px;line-height:1;letter-spacing:-1.5px;color:#ffffff;font-weight:900;text-transform:uppercase;">You're in.</h1>
              </td></tr>
              <tr><td style="padding:0 40px 24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#a1a1aa;font-weight:300;">Thanks for stepping into OSneakers. As promised, here's <strong style="color:#fff;font-weight:600;">{discount_percent}% off</strong> your first drop:</p>
              </td></tr>
              <tr><td align="center" style="padding:8px 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="background:#050505;border:1px solid #00E5FF;">
                  <tr><td align="center" style="padding:22px 36px;">
                    <div style="font-size:10px;letter-spacing:4px;color:#71717a;text-transform:uppercase;font-weight:700;margin-bottom:6px;">CODE</div>
                    <div style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:6px;color:#00E5FF;font-weight:700;">{discount_code}</div>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td align="center" style="padding:0 40px 40px;">
                <a href="https://osneakers.net" style="display:inline-block;background:#00E5FF;color:#050505;padding:16px 36px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">SHOP THE DROP →</a>
              </td></tr>
              <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;color:#71717a;line-height:1.6;">OSneakers · Ontario, Canada · est. 2018<br/>Premium dropshipping for the world's most-wanted sneakers.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
    """


def order_html(order: Order, referral_code: str = "") -> str:
    rows = "".join(
        f"""<tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:14px;">
                <strong style="color:#fff;font-weight:600;">{i.name}</strong>
                <div style="color:#71717a;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">
                    {f"Size {i.size} · " if i.size else ""}Qty {i.quantity}
                </div>
            </td>
            <td align="right" style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-family:'Courier New',monospace;font-size:14px;">${i.price * i.quantity:.2f}</td>
        </tr>"""
        for i in order.items
    )
    discount_row = (
        f"""<tr><td style="padding:6px 0;color:#CCFF00;font-size:13px;">Discount ({order.discount_code})</td>
        <td align="right" style="padding:6px 0;color:#CCFF00;font-family:'Courier New',monospace;font-size:13px;">−${order.discount_amount:.2f}</td></tr>"""
        if order.discount_amount > 0 else ""
    )
    credits_row = (
        f"""<tr><td style="padding:6px 0;color:#CCFF00;font-size:13px;">Store credits</td>
        <td align="right" style="padding:6px 0;color:#CCFF00;font-family:'Courier New',monospace;font-size:13px;">−${order.credits_applied:.2f}</td></tr>"""
        if order.credits_applied > 0 else ""
    )
    referral_block = (
        f'''<tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:11px;letter-spacing:3px;color:#CCFF00;font-weight:700;text-transform:uppercase;margin-bottom:8px;">[ SHARE &amp; EARN ]</div>
          <p style="margin:0 0 12px;color:#a1a1aa;font-size:13px;line-height:1.6;">Share your code — friends get <strong style="color:#fff;">5% off</strong>, you earn <strong style="color:#CCFF00;">5% credit</strong> on every order they place.</p>
          <div style="font-family:'Courier New',monospace;font-size:22px;letter-spacing:5px;color:#CCFF00;font-weight:700;border:1px solid #CCFF00;padding:14px;text-align:center;">{referral_code}</div>
        </td></tr>''' if referral_code else ""
    )
    return f"""
    <!doctype html><html><body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#fff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;">
        <tr><td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
            <tr><td style="padding:40px 40px 8px;">
              <div style="font-size:11px;letter-spacing:3px;color:#00E5FF;font-weight:700;text-transform:uppercase;">[ ORDER CONFIRMED ]</div>
              <h1 style="margin:14px 0 6px;font-size:38px;line-height:1;letter-spacing:-1.5px;color:#fff;font-weight:900;text-transform:uppercase;">You're locked in.</h1>
              <p style="margin:8px 0 0;font-size:12px;letter-spacing:3px;color:#71717a;text-transform:uppercase;font-weight:700;">{order.order_number}</p>
            </td></tr>
            <tr><td style="padding:24px 40px 0;">
              <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.7;">Hey {order.customer_name.split()[0]} — we got your order. Our team will reach out within the hour to confirm sizing &amp; payment.</p>
            </td></tr>
            <tr><td style="padding:24px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table>
            </td></tr>
            <tr><td style="padding:8px 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#a1a1aa;font-size:13px;">Subtotal</td>
                <td align="right" style="padding:6px 0;color:#a1a1aa;font-family:'Courier New',monospace;font-size:13px;">${order.subtotal:.2f}</td></tr>
                {discount_row}
                {credits_row}
                <tr><td style="padding:6px 0;color:#a1a1aa;font-size:13px;">Shipping</td>
                <td align="right" style="padding:6px 0;color:#CCFF00;font-family:'Courier New',monospace;font-size:13px;">FREE</td></tr>
                <tr><td style="padding:14px 0 6px;border-top:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">Total</td>
                <td align="right" style="padding:14px 0 6px;border-top:1px solid rgba(255,255,255,0.1);color:#00E5FF;font-family:'Courier New',monospace;font-size:24px;font-weight:700;">${order.total:.2f}</td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:8px 40px 24px;color:#71717a;font-size:11px;line-height:1.7;">
              <strong style="color:#fff;letter-spacing:2px;text-transform:uppercase;">Ship to</strong><br/>
              {order.customer_name}<br/>{order.address}<br/>{order.city}, {order.country}<br/>{order.phone}
            </td></tr>
            {referral_block}
            <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);color:#71717a;font-size:11px;">
              OSneakers · Ontario, Canada · est. 2018<br/>Questions? Reply to this email or call +1 (289) 600-7311.
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>"""


def campaign_html(code: str, percent: int, headline: str, body: str, expires_at: str) -> str:
    return f"""
    <!doctype html><html><body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#fff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;">
        <tr><td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
            <tr><td style="padding:40px 40px 12px;">
              <div style="font-size:11px;letter-spacing:3px;color:#CCFF00;font-weight:700;text-transform:uppercase;">[ FLASH DROP · 24H ]</div>
              <h1 style="margin:16px 0 0;font-size:42px;line-height:1;letter-spacing:-1.5px;color:#fff;font-weight:900;text-transform:uppercase;">{headline}</h1>
            </td></tr>
            <tr><td style="padding:16px 40px 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">{body}</td></tr>
            <tr><td align="center" style="padding:8px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background:#050505;border:1px solid #CCFF00;">
                <tr><td align="center" style="padding:22px 36px;">
                  <div style="font-size:10px;letter-spacing:4px;color:#71717a;text-transform:uppercase;font-weight:700;margin-bottom:6px;">{percent}% OFF · CODE</div>
                  <div style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:6px;color:#CCFF00;font-weight:700;">{code}</div>
                </td></tr>
              </table>
              <p style="margin:12px 0 0;font-size:10px;letter-spacing:3px;color:#71717a;text-transform:uppercase;">Expires {expires_at[:16].replace('T',' ')} UTC</p>
            </td></tr>
            <tr><td align="center" style="padding:0 40px 40px;">
              <a href="https://osneakers.net" style="display:inline-block;background:#CCFF00;color:#050505;padding:16px 36px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">SHOP NOW →</a>
            </td></tr>
            <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);color:#71717a;font-size:11px;">
              OSneakers · Ontario, Canada · est. 2018
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>"""


def referral_invite_html(code: str, percent: int, note: str) -> str:
    return f"""<!doctype html><html><body style="margin:0;padding:0;background:#050505;font-family:-apple-system,sans-serif;color:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;"><tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="padding:40px;">
            <div style="font-size:11px;letter-spacing:3px;color:#00E5FF;font-weight:700;text-transform:uppercase;">[ A FRIEND SENT YOU THIS ]</div>
            <h1 style="margin:14px 0 16px;font-size:38px;line-height:1;letter-spacing:-1.5px;font-weight:900;text-transform:uppercase;">{percent}% off your first drop.</h1>
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">{note}</p>
            <div style="background:#050505;border:1px solid #CCFF00;padding:18px;text-align:center;margin-bottom:24px;">
              <div style="font-size:10px;letter-spacing:4px;color:#71717a;text-transform:uppercase;font-weight:700;margin-bottom:4px;">USE CODE</div>
              <div style="font-family:'Courier New',monospace;font-size:28px;letter-spacing:5px;color:#CCFF00;font-weight:700;">{code}</div>
            </div>
            <a href="https://osneakers.net" style="display:inline-block;background:#00E5FF;color:#050505;padding:14px 32px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">SHOP THE DROP →</a>
          </td></tr>
        </table>
      </td></tr></table></body></html>"""


def credit_reminder_html(credits: float) -> str:
    return f"""<!doctype html><html><body style="margin:0;background:#050505;font-family:-apple-system,sans-serif;color:#fff;">
      <table width="100%" style="background:#050505;padding:48px 16px;"><tr><td align="center">
        <table width="560" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="padding:40px;">
            <div style="font-size:11px;letter-spacing:3px;color:#CCFF00;font-weight:700;text-transform:uppercase;">[ USE IT OR LOSE IT ]</div>
            <h1 style="margin:14px 0 16px;font-size:38px;line-height:1;letter-spacing:-1.5px;font-weight:900;text-transform:uppercase;">${credits:.2f} expiring soon.</h1>
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">Your referral credits expire in under 14 days. Lock in something fresh before the timer hits zero.</p>
            <a href="https://osneakers.net/catalog" style="display:inline-block;background:#CCFF00;color:#050505;padding:14px 32px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">REDEEM NOW →</a>
          </td></tr>
        </table>
      </td></tr></table></body></html>"""


def abandoned_cart_html(order, code: str, percent: int) -> str:
    rows = "".join(
        f"""<tr>
            <td width="80" style="padding:10px 14px 10px 0;"><img src="{i.image}" width="72" height="72" style="display:block;object-fit:cover;border:1px solid rgba(255,255,255,0.08);"/></td>
            <td style="vertical-align:top;padding:10px 0;">
                <div style="color:#fff;font-size:14px;font-weight:600;">{i.name}</div>
                <div style="color:#71717a;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-top:2px;">
                    {f"Size {i.size} · " if i.size else ""}Qty {i.quantity} · ${i.price:.0f}
                </div>
            </td>
        </tr>"""
        for i in order.items
    )
    first_name = order.customer_name.split()[0] if order.customer_name else "there"
    return f"""<!doctype html><html><body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;"><tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="padding:40px 40px 16px;">
            <div style="font-size:11px;letter-spacing:3px;color:#CCFF00;font-weight:700;text-transform:uppercase;">[ STILL THINKING IT OVER? ]</div>
            <h1 style="margin:14px 0 0;font-size:38px;line-height:1;letter-spacing:-1.5px;font-weight:900;text-transform:uppercase;">{first_name}, your cart is waiting.</h1>
          </td></tr>
          <tr><td style="padding:16px 40px 8px;color:#a1a1aa;font-size:14px;line-height:1.7;">
            You were one click away from locking in:
          </td></tr>
          <tr><td style="padding:8px 40px 16px;"><table width="100%">{rows}</table></td></tr>
          <tr><td align="center" style="padding:8px 40px 16px;">
            <table cellpadding="0" cellspacing="0" style="background:#050505;border:1px solid #CCFF00;">
              <tr><td align="center" style="padding:22px 36px;">
                <div style="font-size:10px;letter-spacing:4px;color:#71717a;text-transform:uppercase;font-weight:700;margin-bottom:6px;">EXTRA {percent}% OFF · CODE</div>
                <div style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:6px;color:#CCFF00;font-weight:700;">{code}</div>
              </td></tr>
            </table>
          </td></tr>
          <tr><td align="center" style="padding:0 40px 40px;">
            <a href="https://osneakers.net/catalog" style="display:inline-block;background:#00E5FF;color:#050505;padding:16px 36px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">FINISH CHECKOUT →</a>
            <p style="margin:14px 0 0;font-size:10px;letter-spacing:2px;color:#71717a;text-transform:uppercase;">Limited sizes · Code valid 24h</p>
          </td></tr>
          <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);color:#71717a;font-size:11px;">
            OSneakers · Ontario, Canada · est. 2018<br/>Questions? Just reply to this email.
          </td></tr>
        </table>
      </td></tr></table></body></html>"""


def digest_html(highlights: list, referral: dict) -> str:
    cards = "".join(
        f"""<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <table width="100%"><tr>
                <td width="80" style="padding-right:14px;"><img src="{p['image']}" width="72" height="72" style="display:block;object-fit:cover;border:1px solid rgba(255,255,255,0.08);"/></td>
                <td style="vertical-align:top;">
                    <div style="font-size:10px;letter-spacing:2px;color:#71717a;text-transform:uppercase;font-weight:700;">{p['brand']}</div>
                    <div style="color:#fff;font-size:14px;font-weight:600;margin-top:2px;">{p['name']}</div>
                    <div style="color:#00E5FF;font-family:'Courier New',monospace;font-size:14px;margin-top:4px;">${p['price']}</div>
                </td>
            </tr></table>
        </td></tr>""" for p in highlights
    )
    uses_label = "" if referral["uses"] == 1 else "s"
    return f"""<!doctype html><html><body style="margin:0;background:#050505;font-family:-apple-system,sans-serif;color:#fff;">
      <table width="100%" style="background:#050505;padding:48px 16px;"><tr><td align="center">
        <table width="560" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="padding:40px 40px 16px;">
            <div style="font-size:11px;letter-spacing:3px;color:#00E5FF;font-weight:700;text-transform:uppercase;">[ DROP DIGEST ]</div>
            <h1 style="margin:14px 0 0;font-size:38px;line-height:1;letter-spacing:-1.5px;font-weight:900;text-transform:uppercase;">This week's heat.</h1>
          </td></tr>
          <tr><td style="padding:8px 40px 16px;"><table width="100%">{cards}</table></td></tr>
          <tr><td style="padding:8px 40px 24px;border-top:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px;letter-spacing:3px;color:#CCFF00;font-weight:700;text-transform:uppercase;margin-bottom:8px;">[ YOUR STATS ]</div>
            <p style="margin:0;color:#a1a1aa;font-size:13px;">Code <strong style="color:#CCFF00;font-family:'Courier New',monospace;">{referral['code']}</strong> · {referral['uses']} use{uses_label} · <strong style="color:#CCFF00;">${referral['credits_earned']:.2f}</strong> credit available</p>
          </td></tr>
          <tr><td align="center" style="padding:8px 40px 40px;">
            <a href="https://osneakers.net/catalog" style="display:inline-block;background:#00E5FF;color:#050505;padding:14px 32px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">SHOP THE DROP →</a>
          </td></tr>
        </table>
      </td></tr></table></body></html>"""
