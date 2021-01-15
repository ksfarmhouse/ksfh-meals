class UsersController < ApplicationController
  def index
  end

  def new
    @user = User.new();
  end

  def create
    @user = User.new(user_params)
    respond_to do |format|
      if @user.save!
        weekly_meals = @user.in_house? ? WeeklyMeal.create_in_meals : WeeklyMeal.create_out_meals
        weekly_meals.member_id = @user.member_id
        if weekly_meals.save!
          format.html {redirect_to new_users_path, notice: "Member Created!"}
        else
          format.html {redirect_to new_users_path, alert: "Member Created, Weekly Meals Not Created!"}
        end
      else
        format.html {redirect_to new_users_path, alert: "Unable to Create Member!"}
      end
    end
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.new();
  end

  def show

  end

  def delete

  end

  private
  def user_params
    params.require(:user).permit(:member_id, :first, :last, :status)
  end
end