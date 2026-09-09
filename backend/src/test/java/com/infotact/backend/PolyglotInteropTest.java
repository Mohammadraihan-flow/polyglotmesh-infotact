package com.infotact.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashMap;
import java.util.Map;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.junit.jupiter.api.Test;

class PolyglotInteropTest {

    @Test
    void javaHashMapCanBeModifiedByPython() {

        // Java creates a HashMap
        Map<String, Object> data = new HashMap<>();
        data.put("name", "PolyglotMesh");
        data.put("price", 100);

        try (Context context = Context.newBuilder("python")
                .allowHostAccess(HostAccess.ALL)
                .allowIO(false)
                .build()) {

            // Pass the Java HashMap directly to Python
            context.getBindings("python")
                    .putMember("data", data);

            // Python modifies the Java HashMap
            context.eval("python",
                    "data['price'] = data['price'] * 2");

            // Java reads the modified value
            assertEquals(200, data.get("price"));

            System.out.println("Java -> Python -> Java successful");
            System.out.println("Updated price: " + data.get("price"));
        }
    }
}