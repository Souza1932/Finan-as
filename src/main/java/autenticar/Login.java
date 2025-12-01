/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package autenticar;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

/**
 * Classe responsável por oferecer os métodos para que seja realizada autenticação do usuário.
 * @author renat
 */
public class Login extends CadastrarConta {

    @Override
    public String getEmail() {
        return super.getEmail(); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }

    @Override
    public void setEmail(String email) {
        super.setEmail(email); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }
    
   private static Argon2  argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
    
    public boolean getHash(String senha, String HashArmazenado) {
         char[] password = senha.toCharArray();
         try{
         return  argon2.verify(HashArmazenado, password);
    }finally{
        argon2.wipeArray(password);
    }
         
}
    
    @Override
    public String getSenhaHash(){
        return this.senhaHash;
    }
    
    
    
}
