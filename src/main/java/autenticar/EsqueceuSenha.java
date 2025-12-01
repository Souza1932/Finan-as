/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package autenticar;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

/**
 *  Esta classe não está sendo executada no momento por não haver funções que enviem uma alteração de senha para o E-mail, mas está como uma
 * à mostra para indicar que esta funcionalida deve existir no sistema. Os método set serve para receber o E-mail inserido pelo o usuário
 * enquanto o get retorna este E-mail enviando uma mensagem pro E-mail solicitando uma nova senha.
 * 
 * @author renat
 */
public class EsqueceuSenha extends CadastrarConta {

   
    @Override
    public String getEmail() {
        return super.getEmail(); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
    }

    @Override
    public void setEmail(String email) {
        super.setEmail(email); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/OverriddenMethodBody
        
   }

   private static final Argon2 argon = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
    
    @Override
    public String hash(String senha) {
       
       char[] password = senha.toCharArray();
       try{
           return argon.hash(10, 65536, 4, password);
       }finally{
           argon.wipeArray(password);
       }
    }
    
    
   
    
    
    
}
