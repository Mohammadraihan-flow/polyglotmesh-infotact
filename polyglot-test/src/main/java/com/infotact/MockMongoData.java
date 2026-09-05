package com.infotact;
import java.util.ArrayList;
import java.util.Comparator;
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
   public static Map<String, Object> findProductByName(String productName)
   {
	    for (Map<String, Object> product : getProductData())
	    {
	        if (product.get("product").toString().equalsIgnoreCase(productName))
	        {
	            return product;
	        }
	    }
	    return null;
	}
   public static List<Map<String, Object>> findProductsByMaxPrice(double maxPrice)
   {
	    List<Map<String, Object>> result = new ArrayList<>();
	    for (Map<String, Object> product : getProductData())
	    {
	        double price = ((Number) product.get("price")).doubleValue();
	        if (price <= maxPrice)
	        {
	            result.add(product);
	        }
	    }
	    return result;
	}
   public static List<Map<String, Object>> findProductsByPriceAndQuantity(double maxPrice, int minQuantity)
   {
	    List<Map<String, Object>> result = new ArrayList<>();
	    for (Map<String, Object> product : getProductData())
	    {
	        double price = ((Number) product.get("price")).doubleValue();
	        int quantity = ((Number) product.get("quantity")).intValue();
	        if (price <= maxPrice && quantity >= minQuantity)
	        {
	            result.add(product);
	        }
	    }
	    return result;
	}
   public static List<Map<String, Object>> findProductsSortedByPrice()
   {
	    List<Map<String, Object>> products = new ArrayList<>(getProductData());
	    products.sort(Comparator.comparingDouble(product -> ((Number) product.get("price")).doubleValue()));
	    return products;
	}
}
