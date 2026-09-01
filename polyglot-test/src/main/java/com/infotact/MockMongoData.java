package com.infotact;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
public class MockMongoData
{
   public static List<Map<String, Object>> getProductData()
   {
	   List<Map<String, Object>> products = new ArrayList<>();
	   Map<String, Object> laptop = new HashMap<>();
       laptop.put("product", "Laptop");
       laptop.put("price", 50000);
       laptop.put("quantity", 2);
       Map<String, Object> phone = new HashMap<>();
       phone.put("product", "Phone");
       phone.put("price", 20000);
       phone.put("quantity", 3);
       products.add(laptop);
       products.add(phone);
       return products;
   }
}
