package com.financas.financas.service;

import com.financas.financas.data.Cadastros;
import com.financas.financas.data.CadastrosRepository;
import com.financas.financas.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CadastrosService {

    @Autowired
    CadastrosRepository repository;

    public List<Cadastros> listarTodos() {
        return repository.findAll();
    }

    public Cadastros salvar(Cadastros cadastro) {
        return repository.save(cadastro);
    }

    public Cadastros buscarPorId(Integer id) {
        return repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Registro não encontrado: " + id));
    }

    public void deletar(Integer id) {
        if(!repository.existsById(id)){
            throw new ResourceNotFoundException("Despesa não encontrada");
        }
        repository.deleteById(id);
    }

    public Cadastros atualizar(Integer id, Cadastros cadastro) {
        if(!repository.existsById(id)){
            throw new ResourceNotFoundException("Não é possível atualizar ou "
                    + "os campos não foram preenchidos.");}
        cadastro.setId(id);
        return repository.save(cadastro);
    }
}
