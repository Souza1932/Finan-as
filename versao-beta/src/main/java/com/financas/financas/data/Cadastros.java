package com.financas.financas.data;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

@Entity
@Table(name = "Cadastros")
public class Cadastros {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @DateTimeFormat(pattern = "dd/MM/yyyy")
    @Column(name = "data")
    private LocalDate data;

    @NotNull(message = "Conta de luz obrigatória")
    @Column(name = "contaDeLuz")
    private float contaDeLuz;

    @Column(name = "contaDeAgua")
    private float contaDeAgua;

    @Column(name = "contaDeInternet")
    private float contaDeInternet;

    @Column(name = "aluguel")
    private float aluguel;

    @Column(name = "gastosComComida")
    private float gastosComComida;

    @Column(name = "despesasComLazer")
    private float despesasComLazer;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public float getContaDeLuz() { return contaDeLuz; }
    public void setContaDeLuz(float contaDeLuz) { this.contaDeLuz = contaDeLuz; }

    public float getContaDeAgua() { return contaDeAgua; }
    public void setContaDeAgua(float contaDeAgua) { this.contaDeAgua = contaDeAgua; }

    public float getContaDeInternet() { return contaDeInternet; }
    public void setContaDeInternet(float contaDeInternet) { this.contaDeInternet = contaDeInternet; }

    public float getAluguel() { return aluguel; }
    public void setAluguel(float aluguel) { this.aluguel = aluguel; }

    public float getGastosComComida() { return gastosComComida; }
    public void setGastosComComida(float gastosComComida) { this.gastosComComida = gastosComComida; }

    public float getDespesasComLazer() { return despesasComLazer; }
    public void setDespesasComLazer(float despesasComLazer) { this.despesasComLazer = despesasComLazer; }
}
