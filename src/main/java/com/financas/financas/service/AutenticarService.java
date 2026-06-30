package com.financas.financas.service;

import com.financas.financas.data.CadastrarConta;
import com.financas.financas.data.CadastrarContaRepository;
import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AutenticarService {

    @Autowired
    CadastrarContaRepository repository;

    private static final Argon2 argon = Argon2Factory.create(
        Argon2Factory.Argon2Types.ARGON2id, 32, 64
    );

    public CadastrarConta cadastrar(CadastrarConta conta) {
        return repository.save(conta);
    }

    public boolean autenticar(String gmail, String senha) {
        Optional<CadastrarConta> conta = repository.findByGmail(gmail);
        if (conta.isEmpty()) return false;

        char[] password = senha.toCharArray();
        try {
            return argon.verify(conta.get().getSenhaHash(), password);
        } finally {
            argon.wipeArray(password);
        }
    }

    public void atualizar(String novoGmail, String novaSenha) {
        Optional<CadastrarConta> opt = repository.findByGmail(novoGmail);
        opt.ifPresent(conta -> {
            conta.setEmail(novoGmail);
            conta.setSenha(novaSenha);
            repository.save(conta);
        });
    }
}
