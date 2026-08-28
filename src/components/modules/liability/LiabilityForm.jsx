import {
  Affix,
  Button,
  Form,
  Grid,
  Input,
  Skeleton,
  DatePicker,
  Space,
  Card,
} from "antd";
import { SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import PageHeader from "src/components/PageHeader";
import InputSelect from "src/components/input/InpuitSelect";
import InputNumeric from "src/components/input/InputNumeric";

const { useBreakpoint } = Grid;

export default function LiabilityForm({
  form,
  isSubmit = false,
  isLoading = false,
  onFinish,
  breadcrumbs = [],
  type = "add",
  onDelete,
}) {
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const formCategoryType = Form.useWatch("category_type", form);

  const handleFinish = (values) => {
    let details = values.details || {};

    if (formCategoryType === "short_term") {
      details = {
        credit_limit: details.credit_limit !== undefined && details.credit_limit !== null
          ? Number(details.credit_limit)
          : 0,
        statement_date: Number(details.statement_date || 1),
        due_date: Number(details.due_date || 1),
        interest_rate: details.interest_rate !== undefined && details.interest_rate !== null
          ? Number(details.interest_rate)
          : 0,
      };
    } else if (formCategoryType === "long_term") {
      details = {
        monthly_installment: details.monthly_installment !== undefined && details.monthly_installment !== null
          ? Number(details.monthly_installment)
          : 0,
        tenor: Number(details.tenor || 0),
        due_date: Number(details.due_date || 1),
        interest_rate_pa: details.interest_rate_pa !== undefined && details.interest_rate_pa !== null
          ? Number(details.interest_rate_pa)
          : 0,
        start_date: details.start_date
          ? typeof details.start_date.format === "function"
            ? details.start_date.format("YYYY-MM-DD")
            : details.start_date
          : null,
      };
    } else {
      details = {};
    }

    onFinish({
      ...values,
      principal_amount: values.principal_amount !== undefined && values.principal_amount !== null
        ? Number(values.principal_amount)
        : 0,
      remaining_balance: values.remaining_balance !== undefined && values.remaining_balance !== null
        ? Number(values.remaining_balance)
        : 0,
      details,
    });
  };

  return (
    <>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <PageHeader breadCrumb={breadcrumbs} backUrl />

          <Card
            variant="borderless"
            style={{
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.25)",
              marginTop: "1.5em",
            }}
            styles={{
              body: {
                padding: isMobile ? "20px 16px" : "28px 32px",
              },
            }}
          >
            <Form
              name="liability-form"
              layout={isMobile ? "vertical" : "horizontal"}
              labelCol={{ md: { span: 6 }, xs: { span: 24 } }}
              wrapperCol={{ md: { span: 14 }, xs: { span: 24 } }}
              onFinish={handleFinish}
              form={form}
              initialValues={{
                details: {
                  statement_date: 1,
                  due_date: 1,
                  tenor: 12,
                  interest_rate_pa: 0,
                  interest_rate: 0,
                },
              }}
            >
              <div>
                <Form.Item
                  label="Category"
                  name="category_id"
                  rules={[{ required: true, message: "Please select a category" }]}
                >
                  <InputSelect
                    datasource="/v1/liabilities/categories"
                    placeholder="Choose Category"
                    selectLabel="id"
                    selectValue="name"
                    disabled={type === "edit"}
                    onChange={(_, opt) => {
                      form.setFieldsValue({ category_type: opt.base_type });
                    }}
                  />
                </Form.Item>

                <Form.Item name="category_type" hidden>
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Liability Name"
                  name="name"
                  rules={[{ required: true, message: "Please enter liability name" }]}
                >
                  <Input placeholder="e.g. Home Mortgage, Credit Card, Personal Loan" />
                </Form.Item>

                <Form.Item
                  label="Principal Plafond"
                  name="principal_amount"
                  rules={[
                    { required: true, message: "Please enter principal amount" },
                    {
                      pattern: /^[0-9]+(\.[0-9]+)?$/,
                      message: "Please enter a valid number",
                    },
                  ]}
                >
                  <InputNumeric useCurrency />
                </Form.Item>

                <Form.Item
                  label="Remaining Balance"
                  name="remaining_balance"
                  rules={[
                    { required: true, message: "Please enter remaining balance" },
                    {
                      pattern: /^[0-9]+(\.[0-9]+)?$/,
                      message: "Please enter a valid number",
                    },
                  ]}
                >
                  <InputNumeric useCurrency />
                </Form.Item>

                {/* Short Term Liability Details */}
                {formCategoryType === "short_term" && (
                  <>
                    <Form.Item
                      label="Credit Limit"
                      name={["details", "credit_limit"]}
                      rules={[
                        {
                          pattern: /^[0-9]+(\.[0-9]+)?$/,
                          message: "Please enter a valid number",
                        },
                      ]}
                    >
                      <InputNumeric useCurrency />
                    </Form.Item>

                    <Form.Item label="Statement Date" required>
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item
                          name={["details", "statement_date"]}
                          noStyle
                          rules={[{ required: true, message: "Please enter statement date" }]}
                        >
                          <InputNumeric
                            inputStyle={{ width: 90 }}
                            min={1}
                            max={31}
                            placeholder="1-31"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>
                          Day of month (Billing statement)
                        </span>
                      </Space>
                    </Form.Item>

                    <Form.Item label="Due Date" required>
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item
                          name={["details", "due_date"]}
                          noStyle
                          rules={[{ required: true, message: "Please enter due date" }]}
                        >
                          <InputNumeric
                            inputStyle={{ width: 90 }}
                            min={1}
                            max={31}
                            placeholder="1-31"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>
                          Day of month (Payment due)
                        </span>
                      </Space>
                    </Form.Item>

                    <Form.Item label="Interest Rate">
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item name={["details", "interest_rate"]} noStyle>
                          <InputNumeric
                            inputStyle={{ width: 100 }}
                            step="any"
                            placeholder="0.0"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>%</span>
                      </Space>
                    </Form.Item>
                  </>
                )}

                {/* Long Term Liability Details */}
                {formCategoryType === "long_term" && (
                  <>
                    <Form.Item
                      label="Monthly Installment"
                      name={["details", "monthly_installment"]}
                      rules={[
                        { required: true, message: "Please enter monthly installment" },
                        {
                          pattern: /^[0-9]+(\.[0-9]+)?$/,
                          message: "Please enter a valid number",
                        },
                      ]}
                    >
                      <InputNumeric useCurrency />
                    </Form.Item>

                    <Form.Item label="Tenor (Months)" required>
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item
                          name={["details", "tenor"]}
                          noStyle
                          rules={[{ required: true, message: "Please enter tenor" }]}
                        >
                          <InputNumeric
                            inputStyle={{ width: 100 }}
                            min={1}
                            placeholder="12"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>Months</span>
                      </Space>
                    </Form.Item>

                    <Form.Item label="Due Date" required>
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item
                          name={["details", "due_date"]}
                          noStyle
                          rules={[{ required: true, message: "Please enter due date" }]}
                        >
                          <InputNumeric
                            inputStyle={{ width: 90 }}
                            min={1}
                            max={31}
                            placeholder="1-31"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>
                          Day of month (Payment due)
                        </span>
                      </Space>
                    </Form.Item>

                    <Form.Item label="Interest Rate">
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item name={["details", "interest_rate_pa"]} noStyle>
                          <InputNumeric
                            inputStyle={{ width: 100 }}
                            step="any"
                            placeholder="0.0"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>% P.A</span>
                      </Space>
                    </Form.Item>

                    <Form.Item
                      label="Start Date"
                      name={["details", "start_date"]}
                      rules={[{ required: true, message: "Please select start date" }]}
                    >
                      <DatePicker
                        placeholder="Select Start Date"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </>
                )}
              </div>

              {/* Bottom Sticky Action Buttons */}
              <Affix offsetBottom={20} style={{ marginTop: "2.5em" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: isMobile ? "stretch" : "flex-end",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(22, 27, 34, 0.9)",
                    backdropFilter: "blur(12px)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #30363D",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {type === "edit" && (
                    <Button
                      type="default"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={onDelete}
                      loading={isSubmit}
                      style={{
                        flex: isMobile ? 1 : "none",
                        minWidth: isMobile ? "auto" : 120,
                        height: 40,
                        borderRadius: 8,
                        background: "rgba(239, 68, 68, 0.1)",
                        borderColor: "rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      Delete
                    </Button>
                  )}

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={isSubmit}
                    style={{
                      flex: isMobile ? 2 : "none",
                      minWidth: isMobile ? "auto" : 140,
                      height: 40,
                      borderRadius: 8,
                      fontWeight: 700,
                      background: "linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)",
                      border: "none",
                      boxShadow: "0 0 12px rgba(37, 99, 235, 0.4)",
                    }}
                  >
                    Save Liability
                  </Button>
                </div>
              </Affix>
            </Form>
          </Card>
        </>
      )}
    </>
  );
}
