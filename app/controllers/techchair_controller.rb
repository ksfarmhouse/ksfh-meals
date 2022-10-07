class TechchairController < ApplicationController
  def index
    redirect_to techchair_login_path unless logged_in?
    params[:admin] = true
  end

  def login
    redirect_to techchair_path if logged_in?
  end

  def login_post
    crew_number = CrewNumber.first
    if crew_number.password_correct?(params[:password])
      login!
      redirect_to techchair_path
    else
      redirect_to techchair_login_path, alert: "Incorrect password"
    end
  end

  def logout
    logout!
    redirect_to techchair_login_path, notice: "Successfully logged out"
  end

  def reset_password
  end

  def reset_techchair_password
    redirect_to techchair_login_path unless logged_in?
    params[:admin] = true
  end

  def reset_techchair_password_post
    redirect_to techchair_login_path unless logged_in?
    error = validate_password?(params[:password], params[:confirm_password])
    if error.blank?
      crew_number = CrewNumber.first
      crew_number.password = params[:password]
      if crew_number.save
        redirect_to techchair_reset_techchair_password_path, notice: "Successfully reset password"
      else
        redirect_to techchair_reset_techchair_password_path, alert: "Unable to reset password"
      end
    else
      redirect_to techchair_reset_techchair_password_path, alert: error
    end
  end

  private
  def validate_password?(password, confirm_password)
    return "Passwords do not match" if password != confirm_password
    return "Password must be at least 8 characters" if password.length < 8
    return ""
  end
end