import { Op } from "sequelize";
import Income from "../Models/income.js";
import Expense from "../Models/expense.js";
import AccountTransfer from "../Models/account_transfer.js";
import Asset from "../Models/asset.js";
import Loan from "../Models/loan.js";
import Project from "../Models/project.js";
import BankAccount from "../Models/bank_account.js";

/**
 * Get report data
 */
export const getReport = async (req, res) => {
  try {
    // Get all incomes summery
    const software_sales_income = await Income.findAll({
      where: { income_source: "Software sales", is_deleted: false },
    });
    const subscription_income = await Income.findAll({
      where: { income_source: "Subscription", is_deleted: false },
    });
    const maintenance_income = await Income.findAll({
      where: {
        income_source: "Support & maintenance contracts",
        is_deleted: false,
      },
    });
    const training_workshops_income = await Income.findAll({
      where: { income_source: "Training & workshops", is_deleted: false },
    });
    const project_income = await Income.findAll({
      where: { income_source: "Project income", is_deleted: false },
    });
    const api_usage_income = await Income.findAll({
      where: { income_source: "API usage charges", is_deleted: false },
    });
    const asset_sales_income = await Income.findAll({
      where: { income_source: "Income from asset sales", is_deleted: false },
    });

    const total_software_sales_income = software_sales_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );
    const total_subscription_income = subscription_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );
    const total_maintenance = maintenance_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );
    const total_training_workshops_income = training_workshops_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );
    const total_project_income = project_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );
    const total_api_usage_income = api_usage_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );
    const total_asset_sales_income = asset_sales_income.reduce(
      (total, income) => Number(total) + Number(income.amount),
      0
    );

    const total_income =
      total_software_sales_income +
      total_subscription_income +
      total_maintenance +
      total_training_workshops_income +
      total_project_income +
      total_api_usage_income +
      total_asset_sales_income;

    // Get all expenses summery
    const office_administration_expense = await Expense.findAll({
      where: {
        expense_reason: "Office & Administration",
        status: "Paid",
        is_deleted: false,
      },
    });
    const infrastructure_expense = await Expense.findAll({
      where: {
        expense_reason: "Technology and infrastructure",
        status: "Paid",
        is_deleted: false,
      },
    });
    const marketing_expense = await Expense.findAll({
      where: {
        expense_reason: "Sales & Marketing",
        status: "Paid",
        is_deleted: false,
      },
    });
    const finance_expense = await Expense.findAll({
      where: {
        expense_reason: "Finance & Legal",
        status: "Paid",
        is_deleted: false,
      },
    });
    const travel_expense = await Expense.findAll({
      where: {
        expense_reason: "Travel & Miscellaneous",
        status: "Paid",
        is_deleted: false,
      },
    });
    const project_expense = await Expense.findAll({
      where: {
        expense_reason: "Project expenses",
        status: "Paid",
        is_deleted: false,
      },
    });
    const asset_purchase_expense = await Expense.findAll({
      where: {
        expense_reason: "Expense for asset purchase",
        status: "Paid",
        is_deleted: false,
      },
    });
    const other_expense = await Expense.findAll({
      where: { expense_reason: "Other", status: "Paid", is_deleted: false },
    });

    const total_office_administration_expense =
      office_administration_expense.reduce(
        (total, expense) => Number(total) + Number(expense.amount),
        0
      );
    const total_infrastructure_expense = infrastructure_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );
    const total_marketing_expense = marketing_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );
    const total_finance_expense = finance_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );
    const total_travel_expense = travel_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );
    const total_project_expense = project_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );
    const total_asset_purchase_expense = asset_purchase_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );
    const total_other_expense = other_expense.reduce(
      (total, expense) => Number(total) + Number(expense.amount),
      0
    );

    const total_expense =
      total_office_administration_expense +
      total_infrastructure_expense +
      total_marketing_expense +
      total_finance_expense +
      total_travel_expense +
      total_project_expense +
      total_asset_purchase_expense +
      total_other_expense;

    // Get all account transfer summery
    const acc_1 = await BankAccount.findOne({
      where: { account_name: "Peal", is_deleted: false },
    });
    const acc_2 = await BankAccount.findOne({
      where: { account_name: "Vault", is_deleted: false },
    });

    const from_peal = await AccountTransfer.findAll({
      where: { from_account: acc_1.account_id, is_deleted: false },
    });
    const to_peal = await AccountTransfer.findAll({
      where: { to_account: acc_1.account_id, is_deleted: false },
    });

    const total_from_peal = from_peal.reduce(
      (total, transfer) => total + transfer.amount,
      0
    );
    const total_to_peal = to_peal.reduce(
      (total, transfer) => total + transfer.amount,
      0
    );

    const total_transfer = total_from_peal + total_to_peal;

    // Get all loan summery
    const loan_to_employee = await Loan.findAll({
      where: {
        to_who: { [Op.ne]: null }, // 'not equal to null'
        status: "Given",
        is_deleted: false,
      },
    });

    const loan_form_external = await Loan.findAll({
      where: {
        from_whom: { [Op.ne]: null }, // 'not equal to null'
        status: "Received",
        is_deleted: false,
      },
    });

    const returned_loan = await Loan.findAll({
      where: {
        from_whom: { [Op.ne]: null }, // 'not equal to null'
        status: "Returned",
        is_deleted: false,
      },
    });

    const repaid_loan = await Loan.findAll({
      where: {
        to_who: { [Op.ne]: null }, // 'not equal to null'
        status: "Repaid",
        is_deleted: false,
      },
    })

    const total_loan_to_employee = loan_to_employee.reduce(
      (total, loan) => Number(total) + Number(loan.amount) + Number(loan.amount) * 0.02,
      0
    );
    const total_loan_from_external = loan_form_external.reduce(
      (total, loan) => Number(total) + Number(loan.amount),
      0
    );
    const total_returned_loan = returned_loan.reduce(
      (total, loan) => Number(total) + Number(loan.amount) + Number(loan.penalty) + Number((loan.amount * interest_rate)/100),
      0
    );
    const total_repaid_loan = repaid_loan.reduce(
      (total, loan) => Number(total) + Number(loan.amount) + Number(loan.penalty) + Number((loan.amount * interest_rate)/100),
      0
    )

    res.status(200).json({
      success: true,
      message: "Report retrieved successfully",
      data: {
        software_sales_income: {
          software_sales_income,
          total_software_sales_income,
        },
        subscription_income: {
          subscription_income,
          total_subscription_income,
        },
        maintenance_income: {
          maintenance_income,
          total_maintenance,
        },
        training_workshops_income: {
          training_workshops_income,
          total_training_workshops_income,
        },
        project_income: {
          project_income,
          total_project_income,
        },
        api_usage_income: {
          api_usage_income,
          total_api_usage_income,
        },
        asset_sales_income: {
          asset_sales_income,
          total_asset_sales_income,
        },
        total_income,

        office_administration_expense: {
          office_administration_expense,
          total_office_administration_expense,
        },
        infrastructure_expense: {
          infrastructure_expense,
          total_infrastructure_expense,
        },
        marketing_expense: {
          marketing_expense,
          total_marketing_expense,
        },
        finance_expense: {
          finance_expense,
          total_finance_expense,
        },
        travel_expense: {
          travel_expense,
          total_travel_expense,
        },
        project_expense: {
          project_expense,
          total_project_expense,
        },
        asset_purchase_expense: {
          asset_purchase_expense,
          total_asset_purchase_expense,
        },
        other_expense: {
          other_expense,
          total_other_expense,
        },
        total_expense,

        account_transfer: {
          to_peal,
          total_to_peal,
          from_peal,
          total_from_peal,
          total_transfer,
        },
        
        loan_to_employee: {
          loan_to_employee,
          total_loan_to_employee,
        },
        loan_from_external: {
          loan_form_external,
          total_loan_from_external,
        },
        returned_loan_to_external: {
          returned_loan,
          total_returned_loan,
        },
        repaid_loan_from_employee: {
          repaid_loan,
          total_repaid_loan,
        },
      },
    });
  } catch (error) {
    console.error("Error in getReport:", error);
    res
      .status(400)
      .json({ success: false, message: error.message });
  }
};
