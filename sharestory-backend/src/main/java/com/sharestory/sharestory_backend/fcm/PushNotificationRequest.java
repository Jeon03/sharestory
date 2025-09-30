package com.sharestory.sharestory_backend.fcm;
public class PushNotificationRequest {
    private String token;
    private String title;
    private String body;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
// getters and setters
}
