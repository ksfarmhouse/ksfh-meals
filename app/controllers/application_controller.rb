class ApplicationController < ActionController::Base
  def login!
    session[:logged_in] = true
  end

  def logged_in?
    session[:logged_in]
  end

  def logout!
    session.delete(:logged_in)
  end
end
