/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package funcionalidades;

/**
 * O propósito desta classe é garantir que as buscas no banco de dados sejam executadas através dos comandos JPQL.
 * @author renat
 */

import autenticar.CadastrarConta;
import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import financasDao.HibernateConnection;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;

public class Consultas {
    HibernateConnection c = new HibernateConnection();
    EntityManager em = c.getManager();
    
    
    public Consultas(EntityManager em){
       this.em = em;
       
    }

   

    public CadastrarConta consultarColunaEmail(String gmail){
      EntityManager em = c.getManager();
      CadastrarConta conta = null;
      try{
          String jpql = "SELECT c FROM CadastrarConta c WHERE c.gmail = :gmail";
          TypedQuery <CadastrarConta> verify = em.createQuery(jpql, CadastrarConta.class);
          verify.setParameter("gmail", gmail);
          conta = verify.getSingleResult();
          return conta;
      }catch(jakarta.persistence.PersistenceException a){
           a.getStackTrace();
           return null;
      }
    
  }
    
   
    
    public void atualizar(String gmail, String senhaHash, String nome){
        EntityManager em = c.getManager();
        Argon2 argon = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id);
        char[] password = senhaHash.toCharArray();
        
        try{
            String hash = argon.hash(10, 65536, 4, password);
            em.getTransaction().begin();
            String jpql = "UPDATE CadastrarConta c SET c.gmail = :gmail, c.senhaHash = :senhaHash  WHERE c.nome = :nome ";
            Query query = em.createQuery(jpql);
            query.setParameter("gmail", gmail);
            query.setParameter("senhaHash", hash);
            query.setParameter("nome", nome);
            query.executeUpdate();
            
          
            em.getTransaction().commit();
            java.util.Arrays.fill(password, ' ');
            
            
        }catch(Exception d){
            d.printStackTrace();
            em.getTransaction().rollback();
        }
    }
    
    public CadastrarConta consultarNome(String nome){
        EntityManager em = c.getManager();
        String sql = "SELECT c FROM CadastrarConta c WHERE c.nome = :nome";
        TypedQuery <CadastrarConta> query = em.createQuery(sql, CadastrarConta.class);
        try{
            query.setParameter("nome", nome);
            CadastrarConta conta = query.getSingleResult();
            return conta;
            
            
        }catch(Exception e){
            e.getStackTrace();
            return null;
        }
        
    }
      
      

    
    

    

    
 
    
    
}
