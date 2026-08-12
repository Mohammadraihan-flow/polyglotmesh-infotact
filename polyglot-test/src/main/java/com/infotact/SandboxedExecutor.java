package com.infotact;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Source;
import java.io.OutputStream;

public class SandboxedExecutor {

    public static String execute(String lang, String code) {
        StringBuilder sb = new StringBuilder();

        OutputStream capture = new OutputStream() {
            public void write(int b) {
                sb.append((char) b);
            }
        };

        try (Context ctx = Context.newBuilder(lang)
                .allowAllAccess(false)
                .allowHostAccess(HostAccess.NONE)
                .allowIO(false)
                .allowCreateThread(false)
                .allowNativeAccess(false)
                .out(capture)
                .build()) {

            ctx.eval(Source.create(lang, code));

        } catch (PolyglotException e) {
            sb.append("ERROR: ").append(e.getMessage());
        }

        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(execute("python", "print('Sandboxed Python running!')"));
        System.out.println(execute("js", "console.log('Sandboxed JS running!')"));

        // trying to write a file — should fail
        System.out.println(execute("python", "open('C:/test.txt', 'w')"));
    }
}