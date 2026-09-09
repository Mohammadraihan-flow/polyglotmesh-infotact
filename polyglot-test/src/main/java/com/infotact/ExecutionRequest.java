package com.infotact;
public class ExecutionRequest
{
    private String lang;
    private String code;
    public ExecutionRequest()
    {
    	
    }
    public ExecutionRequest(String lang,String code)
    {
    	this.lang=lang;
    	this.code=code;
    }
    public String getLang()
    {
        return lang;
    }
    public void setLang(String lang)
    {
        this.lang = lang;
    }
    public String getCode()
    {
        return code;
    }
    public void setCode(String code)
    {
        this.code = code;
    }
}
