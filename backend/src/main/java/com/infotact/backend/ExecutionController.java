package com.infotact.backend;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import org.graalvm.polyglot.Context;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ExecutionController {

    @PostMapping("/execute")
    public ExecutionResponse execute(@RequestBody ExecutionRequest request) {

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try (Context context = Context.newBuilder(request.getLanguage())
                .allowHostAccess(false)
                .allowIO(false)
                .out(new PrintStream(outputStream))
                .build()) {

            context.eval(
                    request.getLanguage(),
                    request.getCode()
            );

            return new ExecutionResponse(
                    outputStream.toString(),
                    null
            );

        } catch (Exception e) {

            return new ExecutionResponse(
                    outputStream.toString(),
                    e.getMessage()
            );
        }
    }
}