package com.financas.financas.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CadastrarContaRepository
        extends JpaRepository<CadastrarConta, Integer> {

    Optional<CadastrarConta> findByGmail(String gmail);
}
