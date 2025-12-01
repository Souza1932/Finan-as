/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package autenticar;

/**
 *   Propósito desta classe é oferecer os atributos para que o cadastro do usuário no sistema seja realizada.
 *   
 * @author renat
 */

import de.mkammerer.argon2.Argon2Factory;
import de.mkammerer.argon2.Argon2;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;


@Entity
public class CadastrarConta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String nome;
    private String gmail;
    public String senhaHash;

  
    public void setId(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }
    
    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
    
    
    public void setEmail(String email){
        this.gmail = email;
    }
    
    public String getEmail(){
        return gmail;
    }
    
   
    private static final Argon2 argon = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id, 32, 64);
    
    public String hash(String senha){
         
         char[] password = senha.toCharArray();
         try{
             return argon.hash(10, 65536, 4, senha);
         }finally{
             argon.wipeArray(password);
         }
    }
    
     public String setSenha(String senha){
         char[] password = senha.toCharArray();
         try{
        return this.senhaHash = argon.hash(10, 65536, 4, password);
         }finally{
             argon.wipeArray(password);
         }
    }
    
    public String getSenhaHash(){
       return this.senhaHash;
         
    }
  
 
    
    
    




}
