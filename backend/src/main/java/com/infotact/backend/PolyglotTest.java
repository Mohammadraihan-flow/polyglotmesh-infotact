package com.infotact.backend;

import org.graalvm.polyglot.Context;

public class PolyglotTest {

    public static void main(String[] args) {

        try (Context context = Context.newBuilder("python")
                .allowHostAccess(false)
                .build()) {

            context.eval("python", "print('Hello from Python')");
        }
    }
}