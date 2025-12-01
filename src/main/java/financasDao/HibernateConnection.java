
package financasDao;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

/**
 * Responsável por criar ManagerFactory e manager para que seja utilizado as Instruções de consultas SQLs em java.
 * @author renat
 * 
 */



public class HibernateConnection {
    
   private static final String PERSISTENCE_UNIT_NAME = "Financa";
    
   private static  EntityManagerFactory fabrica;
   private EntityManager manager;
   
   public EntityManager getManager(){
       if(fabrica == null || !fabrica.isOpen()){
           fabrica = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT_NAME);
       }
       if(manager == null || !manager.isOpen()){
           manager = fabrica.createEntityManager();
       }
       return manager;
       
   }
   
   public void close(){
       manager.close();
       fabrica.close();
   }
    
    

}
