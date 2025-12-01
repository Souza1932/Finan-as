/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package funcionalidades;

import autenticar.Login;
import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

/**
 *  Caso o usuário queira trocar de E-mail ou de senha, esta classe se encarrega de oferecer os métodos para que seja executado a funcionalidade.
 *  Um ponto importante. As configurações terão mais funcionalidades, mas o netBeans não oferece ferramentas para que seja executada estas 
 * funcionalidades no momento, como um protótipo só tera a funcionalidade de redefinição de E-mail e senha.
 * 
 * @author renat
 */
public class Configuracoes extends Login {

    @Override
    public void setEmail(String email) {
        super.setEmail(email); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }

    @Override
    public String getEmail() {
        return super.getEmail(); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }

    @Override
    public String setSenha(String senha) {
        return super.setSenha(senha); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }

    
    public String getSenha() {
        return super.getSenhaHash(); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }

    private static final Argon2 argon = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);

   
   public String atualizarSenha(String HashArmazenado, String senha){
       char[] password = senha.toCharArray();
       try{
       if(argon.verify(HashArmazenado, password)){
           String novoHash = argon.hash(10, 65536, 4, password);
           return novoHash;
       }else{
           return null;
       }
       
   }finally{
           argon.wipeArray(password);
       }
   }
    
    
    
    
}
