package com.financas.financas.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDate;

@Repository
public interface CadastrosRepository
        extends JpaRepository<Cadastros, Integer> {

    List<Cadastros> findByData(LocalDate data);
    List<Cadastros> findByOrderByDataDesc();
}
