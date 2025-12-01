/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/*
Propósito desta classe é conectar o sistema ao banco de dados para salvar, atualizar e remover registros no banco de dados.
@author Renat
*/
package financasDao;

import funcionalidades.Cadastros;
import jakarta.persistence.EntityManager;
import autenticar.CadastrarConta;
import jakarta.persistence.Query;


public class ConectarBanco {
    
    private  EntityManager em;

    public ConectarBanco() {
        throw new UnsupportedOperationException("Not supported yet."); // Generated from nbfs://nbhost/SystemFileSystem/Templates/Classes/Code/GeneratedMethodBody
    }
    public EntityManager getManager(){
        em = this.getManager();
        return em;
    }
    
    public ConectarBanco(EntityManager em){
        this.em = em;
    }
    
     
    
    public CadastrarConta CadastroConta(CadastrarConta login){
           
        try{
            em.getTransaction().begin();
            em.persist(login);
            em.getTransaction().commit();
            return login;
        }catch(Exception a ){
            em.getTransaction().rollback();
            throw a;
        }
    }
    
    public Cadastros AdicionarConta(Cadastros cadastro){
       
        try{
            em.getTransaction().begin();
            em.persist(cadastro);
            em.getTransaction().commit();
            return cadastro;
        }catch(Exception b){
            em.getTransaction().rollback();
            throw b;
        }
   }
    
  
    
    public void removerEmail(String gmail){
       try{
       em.getTransaction().begin();
       Query query = em.createQuery("DELETE FROM CadastrarConta c WHERE c.gmail = :gmail");
       query.setParameter("gmail", gmail);
       query.executeUpdate();
       em.getTransaction().commit();
       }catch(Exception e){
           e.printStackTrace();
       }
       
   }
    
  

    
  
    
    
    
    
    
   
    
    
    










































































}
