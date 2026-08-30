package com.infotact;
import java.util.HashMap;
import java.util.Map;
public class MockMongoData
{
   public static Map<String, Object> getProductData()
   {
	   Map<String, Object> product = new HashMap<>();
       product.put("product", "Laptop");
       product.put("price", 50000);
       product.put("quantity", 2);
       return product;
   }
}
