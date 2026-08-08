package com.financas.financas.data;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "CadastrarConta")
public class CadastrarConta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @NotBlank(message = "Nome obrigatório")
    @Column(name = "nome")
    private String nome;

    @NotBlank(message = "E-mail obrigatório")
    @Email(message = "E-mail inválido")
    @Column(name = "gmail", unique = true)
    private String gmail;

    @Column(name = "senhaHash")
    public String senhaHash;

    private static final Argon2 argon = Argon2Factory.create(
        Argon2Factory.Argon2Types.ARGON2id, 32, 64
    );

    public void setId(Integer id) {
        this.id = id;
    }
    public Integer getId() {
        return id;
    }
    
    public void setNome(String nome) {
        this.nome = nome;
    }
    public String getNome() {
        return nome;
    }

    public void setEmail(String email) {
        this.gmail = email;
    }
    public String getEmail() {
        return gmail;
    }
    
    public String getGmail() {
    return gmail;
}

    public void setGmail(String gmail) {
    this.gmail = gmail;
   }

    public String hash(String senha) {
        char[] password = senha.toCharArray();
        try {
            return argon.hash(10, 65536, 4, senha);
        } finally {
            argon.wipeArray(password);
        }
    }

    public void setSenha(String senha) {
        char[] password = senha.toCharArray();
        try {
            this.senhaHash = argon.hash(10, 65536, 4, password);
        } finally {
            argon.wipeArray(password);
        }
    }

    public String getSenhaHash() {
        return this.senhaHash;
    }
}
