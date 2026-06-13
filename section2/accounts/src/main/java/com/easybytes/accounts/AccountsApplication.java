package com.easybytes.accounts;

import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditAwareImpl")
@OpenAPIDefinition(
        info = @Info(
                title = "Accounts microservice REST API Documentation",
                description = "EasyBank Accounts microservice REST API Documentation",
                version = "v1",
                contact = @Contact(
                        name = "Pavan Gokavi",
                        email = "pavangokavi@gmail.com",
                        url = "pavangokavi@gmail.com"
                ),
                license = @License(
                        name = "Apache 2.0",
                        url = "pavangokavi@gmail.com"
                )
        ),
        externalDocs = @ExternalDocumentation(
                description =  "EasyBank Accounts microservice REST API Documentation"

        )
)
public class AccountsApplication {

	public static void main(String[] args) {

        SpringApplication.run(AccountsApplication.class, args);
	}

}
