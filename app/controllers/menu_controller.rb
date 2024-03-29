class MenuController < ApplicationController
  def index
    @menu = Menu.where(date: Date.today..(Date.today + 6.days)).order(:date)
  end

  def new
    redirect_to techchair_login_path unless logged_in?
    @menu = Menu.new(date: Date.today)
    params[:admin] = true
  end

  def create
    redirect_to techchair_login_path unless logged_in?
    @menu = Menu.new(menu_params)
    respond_to do |format|
      if Menu.where(date: @menu.date).blank?
        if @menu.save
          format.html {redirect_to menu_new_path, notice: "Menu Item Created!"}
        else
          format.html {redirect_to menu_new_path, alert: "Unable to Create Menu Item!"}
        end
      else
        format.html {redirect_to menu_new_path, alert: "Menu Item Already Created for that Day!"}
      end
    end
  end

  def edit
    redirect_to techchair_login_path unless logged_in?
    @menu = Menu.find(params[:id])
    params[:admin] = true
  end

  def update
    redirect_to techchair_login_path unless logged_in?
    @menu = Menu.find(params[:id])
    respond_to do |format|
      if @menu.update(menu_params)
        format.html {redirect_to menu_edit_path(id: @menu.id), notice: "Menu Item Updated!"}
      else
        format.html {redirect_to menu_edit_path(id: @menu.id), alert: "Unable to Update Menu Item!"}
      end
    end
  end

  def list
    redirect_to techchair_login_path unless logged_in?
    @items = Menu.all.order(:date)
    params[:admin] = true
  end

  def delete
    redirect_to techchair_login_path unless logged_in?
    @menu = Menu.find(params[:id])
    respond_to do |format|
      if @menu.delete
        format.html {redirect_to menu_list_path, notice: "Menu Item Deleted!"}
      else
        format.html {redirect_to menu_list_path, alert: "Unable to Delete Menu Item!"}
      end
    end
  end

  private
  def menu_params
    params.require(:menu).permit(:date, :lunch, :dinner)
  end
end