package com.sharestory.sharestory_backend.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class CookieUtil {
    public static void addCookie(HttpServletResponse res, String name, String value,
                                 int maxAge, String domain, boolean secure, String sameSite) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        if (domain != null && !domain.isBlank()) cookie.setDomain(domain);
        cookie.setSecure(secure);
        res.addHeader("Set-Cookie",
                cookie.getName() + "=" + cookie.getValue()
                        + "; Path=" + cookie.getPath()
                        + "; Max-Age=" + cookie.getMaxAge()
                        + "; HttpOnly"
                        + (secure ? "; Secure" : "")
                        + (sameSite != null ? "; SameSite=" + sameSite : ""));
    }

    public static void clearCookie(HttpServletResponse res, String name, String domain, boolean secure, String sameSite) {
        addCookie(res, name, "", 0, domain, secure, sameSite);
    }

    public static String getCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) if (c.getName().equals(name)) return c.getValue();
        return null;
    }
}