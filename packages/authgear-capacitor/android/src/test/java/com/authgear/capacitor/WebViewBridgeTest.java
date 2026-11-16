package com.authgear.capacitor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class WebViewBridgeTest {

    // Converts JSON to plain maps and lists, so that two values compare with equals.
    private static Object plain(Object value) throws Exception {
        if (value instanceof JSONObject) {
            JSONObject obj = (JSONObject) value;
            Map<String, Object> map = new HashMap<>();
            Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                map.put(key, plain(obj.get(key)));
            }
            return map;
        }
        if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            List<Object> list = new ArrayList<>();
            for (int i = 0; i < array.length(); i++) {
                list.add(plain(array.get(i)));
            }
            return list;
        }
        return value;
    }

    private static void assertJsonEquals(String expected, String actual) throws Exception {
        assertEquals(plain(new JSONObject(expected)), plain(new JSONObject(actual)));
    }

    @Test
    public void allowedOriginRuleWithoutPort() throws Exception {
        assertEquals("https://auth.example.com", WebViewBridge.allowedOriginRule(new URI("https://auth.example.com")));
    }

    @Test
    public void allowedOriginRuleWithExplicitPort() throws Exception {
        assertEquals("http://localhost:3000", WebViewBridge.allowedOriginRule(new URI("http://localhost:3000")));
    }

    @Test
    public void allowedOriginRuleDropsUserInfo() throws Exception {
        assertEquals(
                "https://auth.example.com:8443",
                WebViewBridge.allowedOriginRule(new URI("https://user:pass@auth.example.com:8443"))
        );
    }

    @Test
    public void allowedOriginRuleDropsPathAndQuery() throws Exception {
        assertEquals(
                "https://auth.example.com",
                WebViewBridge.allowedOriginRule(new URI("https://auth.example.com/oauth2/authorize?client_id=a#b"))
        );
    }

    @Test
    public void allowedOriginRuleWithoutHost() throws Exception {
        // java.net.URI has no host for a hostname with "_".
        assertNull(WebViewBridge.allowedOriginRule(new URI("https://my_app.example.com")));
        assertNull(WebViewBridge.allowedOriginRule(new URI("auth.example.com")));
    }

    @Test
    public void credentialManagerRequestJsonKeepsOnlyTheSpecFields() throws Exception {
        JSONObject publicKey = new JSONObject(
                "{\"challenge\":\"c\",\"rpId\":\"auth.example.com\",\"userVerification\":\"preferred\"," +
                        "\"allowCredentials\":[{\"type\":\"public-key\",\"id\":\"a\"}]," +
                        "\"timeout\":60000,\"hints\":[\"security-key\"],\"extensions\":{\"prf\":{}}}"
        );
        assertJsonEquals(
                "{\"challenge\":\"c\",\"rpId\":\"auth.example.com\",\"userVerification\":\"preferred\"," +
                        "\"allowCredentials\":[{\"type\":\"public-key\",\"id\":\"a\"}]}",
                WebViewBridge.credentialManagerRequestJson(publicKey).toString()
        );
    }

    @Test
    public void credentialManagerRequestJsonDropsEmptyAllowCredentials() throws Exception {
        JSONObject publicKey = new JSONObject("{\"challenge\":\"c\",\"rpId\":\"auth.example.com\",\"allowCredentials\":[]}");
        assertJsonEquals(
                "{\"challenge\":\"c\",\"rpId\":\"auth.example.com\"}",
                WebViewBridge.credentialManagerRequestJson(publicKey).toString()
        );
    }

    @Test
    public void sameOriginEqual() throws Exception {
        assertTrue(WebViewBridge.sameOrigin(new URI("https://auth.example.com/login"), new URI("https://auth.example.com")));
    }

    @Test
    public void sameOriginDifferentHost() throws Exception {
        assertFalse(WebViewBridge.sameOrigin(new URI("https://auth.example.com"), new URI("https://example.com")));
    }

    @Test
    public void sameOriginDifferentScheme() throws Exception {
        assertFalse(WebViewBridge.sameOrigin(new URI("https://auth.example.com"), new URI("http://auth.example.com")));
    }

    @Test
    public void sameOriginDifferentPort() throws Exception {
        assertFalse(WebViewBridge.sameOrigin(new URI("https://auth.example.com:8443"), new URI("https://auth.example.com")));
    }

    @Test
    public void sameOriginExplicitDefaultPortEqualsNoPort() throws Exception {
        assertTrue(WebViewBridge.sameOrigin(new URI("https://auth.example.com:443"), new URI("https://auth.example.com")));
        assertTrue(WebViewBridge.sameOrigin(new URI("http://localhost"), new URI("http://localhost:80")));
    }

    @Test
    public void isSameOriginOfStrings() {
        assertTrue(WebViewBridge.isSameOrigin("https://auth.example.com/login?x=1", "https://auth.example.com"));
        assertFalse(WebViewBridge.isSameOrigin("https://other.example.com/", "https://auth.example.com"));
        assertFalse(WebViewBridge.isSameOrigin(null, "https://auth.example.com"));
        assertFalse(WebViewBridge.isSameOrigin("https://auth.example.com", null));
        assertFalse(WebViewBridge.isSameOrigin("https://auth example.com", "https://auth.example.com"));
        assertFalse(WebViewBridge.isSameOrigin("about:blank", "https://auth.example.com"));
    }

    @Test
    public void capabilitiesReplyListsTheCapabilities() throws Exception {
        assertJsonEquals(
                "{\"id\":\"1\",\"status\":\"ok\",\"capabilities\":" +
                        "[\"credentials.get\",\"credentials.get:publicKey\",\"credentials.get:immediate\"]}",
                WebViewBridge.capabilitiesReply("1")
        );
    }

    @Test
    public void parseRequestValid() {
        WebViewBridge.Request request = WebViewBridge.parseRequest("{\"id\":\"1\",\"type\":\"bridge.capabilities\",\"extra\":true}");
        assertNotNull(request);
        assertEquals("1", request.id);
        assertEquals("bridge.capabilities", request.type);
        assertEquals(true, request.json.opt("extra"));
    }

    @Test
    public void parseRequestWithoutType() {
        WebViewBridge.Request request = WebViewBridge.parseRequest("{\"id\":\"1\"}");
        assertNotNull(request);
        assertEquals("1", request.id);
        assertNull(request.type);
    }

    @Test
    public void parseRequestNonStringType() {
        WebViewBridge.Request request = WebViewBridge.parseRequest("{\"id\":\"1\",\"type\":1}");
        assertNotNull(request);
        assertNull(request.type);
    }

    @Test
    public void parseRequestNotJson() {
        assertNull(WebViewBridge.parseRequest("not json"));
        assertNull(WebViewBridge.parseRequest(""));
        assertNull(WebViewBridge.parseRequest("{\"id\":\"1\"} trailing"));
    }

    @Test
    public void parseRequestJsonArray() {
        assertNull(WebViewBridge.parseRequest("[{\"id\":\"1\"}]"));
    }

    @Test
    public void parseRequestMissingId() {
        assertNull(WebViewBridge.parseRequest("{\"type\":\"bridge.capabilities\"}"));
    }

    @Test
    public void parseRequestNonStringId() {
        assertNull(WebViewBridge.parseRequest("{\"id\":1,\"type\":\"bridge.capabilities\"}"));
        assertNull(WebViewBridge.parseRequest("{\"id\":null,\"type\":\"bridge.capabilities\"}"));
    }

    @Test
    public void replyWithEachStatus() throws Exception {
        for (String status : Arrays.asList("ok", "no_credential", "cancelled", "unsupported", "error")) {
            assertJsonEquals("{\"id\":\"7\",\"status\":\"" + status + "\"}", WebViewBridge.reply("7", status));
        }
    }

    @Test
    public void replyWithMessage() throws Exception {
        assertJsonEquals(
                "{\"id\":\"7\",\"status\":\"error\",\"message\":\"boom\"}",
                WebViewBridge.reply("7", "error", "boom")
        );
    }

    @Test
    public void okReplyCarriesTheCredentialUnchanged() throws Exception {
        String credentialText = "{" +
                "\"id\":\"dFcL6B0cTujk-mONTRqsP4TXVrLWWvzWfa7oG_b36T8\"," +
                "\"rawId\":\"dFcL6B0cTujk-mONTRqsP4TXVrLWWvzWfa7oG_b36T8\"," +
                "\"type\":\"public-key\"," +
                "\"authenticatorAttachment\":\"platform\"," +
                "\"response\":{" +
                "\"clientDataJSON\":\"Y2xpZW50RGF0YQ\"," +
                "\"authenticatorData\":\"YXV0aERhdGE\"," +
                "\"signature\":\"c2lnbmF0dXJl\"," +
                "\"userHandle\":\"dXNlcg\"" +
                "}," +
                "\"clientExtensionResults\":{}" +
                "}";
        String reply = WebViewBridge.reply(
                "2",
                "ok",
                null,
                Collections.<String, Object>singletonMap("credential", new JSONObject(credentialText))
        );
        assertJsonEquals("{\"id\":\"2\",\"status\":\"ok\",\"credential\":" + credentialText + "}", reply);
    }
}
