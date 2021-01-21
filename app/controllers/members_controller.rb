class MembersController < ApplicationController
  def index
    @members = Member.all.order(:last)
    params[:admin] = true
  end

  def new
    @member = Member.new
    params[:admin] = true
  end

  def create
    @member = Member.new(user_params)
    respond_to do |format|
      if Member.where(member_id: params[:member][:member_id]).blank?
        if @member.save!
          weekly_meals = @member.in_house? ? WeeklyMeal.create_in_meals : WeeklyMeal.create_out_meals
          weekly_meals.member_id = @member.member_id
          if weekly_meals.save!
            format.html {redirect_to new_members_path, notice: "Member Created!"}
          else
            format.html {redirect_to new_members_path, alert: "Member Created, Weekly Meals Not Created!"}
          end
        else
          format.html {redirect_to new_members_path, alert: "Unable to Create Member!"}
        end
      else
        format.html {redirect_to new_members_path, alert: "Member ID Already Taken!"}
      end
    end
  end

  def edit
    @member = Member.find(params[:id])
    params[:admin] = true
  end

  def update
    @member = Member.find(params[:id])
    respond_to do |format|
      if @member.update(user_params)
        format.html {redirect_to edit_members_path(id: @member.id), notice: "Member Updated!"}
      else
        format.html {redirect_to edit_members_path(id: @member.id), alert: "Unable to Update Member!"}
      end
    end
  end

  def delete

  end

  private
  def user_params
    params.require(:member).permit(:member_id, :first, :last, :status)
  end
end