class MenuController < ApplicationController
  def index
    @menu = Menu.where(date: Date.today..(Date.today + 6.days))
  end

  def new
    @menu = Menu.new(date: Date.today)
  end

  def create
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
    @menu = Menu.find(params[:id])
  end

  def update
    @menu = Menu.find(params[:id])
    respond_to do |format|
      if @menu.update(menu_params)
        format.html {redirect_to menu_edit_path(id: @menu.id), notice: "Menu Item Updated!"}
      else
        format.html {redirect_to menu_edit_path(id: @menu.id), alert: "Unable to Update Menu Item!"}
      end
    end
  end

  private
  def menu_params
    params.require(:menu).permit(:date, :lunch, :dinner)
  end
end