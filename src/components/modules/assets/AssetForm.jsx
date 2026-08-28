import {
  Affix,
  Button,
  Form,
  Grid,
  Input,
  Skeleton,
  Checkbox,
  DatePicker,
  Space,
  Card,
} from "antd";
import { SaveOutlined, DeleteOutlined } from "@ant-design/icons";
import PageHeader from "src/components/PageHeader";
import InputSelect from "src/components/input/InpuitSelect";
import InputNumeric from "src/components/input/InputNumeric";

const { useBreakpoint } = Grid;

export default function AssetForm({
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

    if (formCategoryType === "liquid") {
      details = {
        platform_name: details.platform_name || "",
        account_name: details.account_name || "",
        account_number: details.account_number || "",
        interest_rate_pa: details.interest_rate_pa !== undefined && details.interest_rate_pa !== null
          ? Number(details.interest_rate_pa)
          : 0,
      };
    } else if (formCategoryType === "investment") {
      details = {
        platform_name: details.platform_name || "",
        ticker_symbol: details.ticker_symbol || "",
        average_price: details.average_price !== undefined && details.average_price !== null
          ? Number(details.average_price)
          : 0,
        quantity: details.quantity !== undefined && details.quantity !== null
          ? Number(details.quantity)
          : 0,
      };
    } else if (formCategoryType === "physical") {
      details = {
        model: details.model || "",
        purchase_year: details.purchase_year
          ? typeof details.purchase_year === "object" &&
            typeof details.purchase_year.year === "function"
            ? details.purchase_year.year()
            : parseInt(details.purchase_year, 10)
          : null,
        purchase_price: details.purchase_price !== undefined && details.purchase_price !== null
          ? Number(details.purchase_price)
          : 0,
      };
    } else {
      details = {};
    }

    onFinish({
      ...values,
      current_value: values.current_value !== undefined && values.current_value !== null
        ? Number(values.current_value)
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
              name="asset-form"
              layout={isMobile ? "vertical" : "horizontal"}
              labelCol={{ md: { span: 6 }, xs: { span: 24 } }}
              wrapperCol={{ md: { span: 14 }, xs: { span: 24 } }}
              onFinish={handleFinish}
              form={form}
              initialValues={{
                is_active: true,
              }}
            >
              <div>
                <Form.Item
                  label="Category"
                  name="category_id"
                  rules={[{ required: true, message: "Please select a category" }]}
                >
                  <InputSelect
                    datasource="/v1/assets/categories"
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
                  label="Asset Name"
                  name="name"
                  rules={[{ required: true, message: "Please enter asset name" }]}
                >
                  <Input placeholder="e.g. Primary Savings, Apple Stock, House" />
                </Form.Item>

                <Form.Item
                  label="Current Value"
                  name="current_value"
                  rules={[{ required: true, message: "Please enter current value" }]}
                >
                  <InputNumeric useCurrency />
                </Form.Item>

                <Form.Item
                  label="Status"
                  name="is_active"
                  valuePropName="checked"
                  getValueProps={(value) => ({
                    checked: value,
                  })}
                  getValueFromEvent={(e) => e.target.checked}
                >
                  <Checkbox>Active Asset</Checkbox>
                </Form.Item>

                {/* Liquid / Cash Asset Details */}
                {formCategoryType === "liquid" && (
                  <>
                    <Form.Item
                      label="Bank / Platform"
                      name={["details", "platform_name"]}
                      rules={[{ required: true, message: "Please enter platform name" }]}
                    >
                      <Input placeholder="e.g. Chase, Bank of America, PayPal" />
                    </Form.Item>

                    <Form.Item
                      label="Account Name"
                      name={["details", "account_name"]}
                    >
                      <Input placeholder="e.g. Primary Checking" />
                    </Form.Item>

                    <Form.Item
                      label="Account Number"
                      name={["details", "account_number"]}
                    >
                      <Input placeholder="e.g. 1234567890" />
                    </Form.Item>

                    <Form.Item label="Interest Rate">
                      <Space align="center" style={{ width: "100%" }}>
                        <Form.Item name={["details", "interest_rate_pa"]} noStyle>
                          <InputNumeric
                            inputStyle={{ width: 120 }}
                            step="any"
                            placeholder="0.0"
                          />
                        </Form.Item>
                        <span style={{ color: "#8B949E", fontSize: 13 }}>% P.A</span>
                      </Space>
                    </Form.Item>
                  </>
                )}

                {/* Investment Asset Details */}
                {formCategoryType === "investment" && (
                  <>
                    <Form.Item
                      label="Platform"
                      name={["details", "platform_name"]}
                      rules={[{ required: true, message: "Please enter platform name" }]}
                    >
                      <Input placeholder="e.g. Robinhood, Interactive Brokers, Binance" />
                    </Form.Item>

                    <Form.Item
                      label="Ticker / Symbol"
                      name={["details", "ticker_symbol"]}
                      rules={[{ required: true, message: "Please enter ticker symbol" }]}
                    >
                      <Input placeholder="e.g. AAPL, BTC, SPY" />
                    </Form.Item>

                    <Form.Item
                      label="Average Price"
                      name={["details", "average_price"]}
                      rules={[
                        { required: true, message: "Please enter average price" },
                        {
                          pattern: /^[0-9]+(\.[0-9]+)?$/,
                          message: "Please enter a valid number",
                        },
                      ]}
                    >
                      <InputNumeric useCurrency step="any" />
                    </Form.Item>

                    <Form.Item
                      label="Quantity"
                      name={["details", "quantity"]}
                      rules={[
                        { required: true, message: "Please enter quantity" },
                        {
                          pattern: /^[0-9]+(\.[0-9]+)?$/,
                          message: "Please enter a valid number",
                        },
                      ]}
                    >
                      <InputNumeric step="any" placeholder="e.g. 10 or 0.05" />
                    </Form.Item>
                  </>
                )}

                {/* Physical Asset Details */}
                {formCategoryType === "physical" && (
                  <>
                    <Form.Item
                      label="Brand / Model"
                      name={["details", "model"]}
                      rules={[{ required: true, message: "Please enter model/brand" }]}
                    >
                      <Input placeholder="e.g. Honda Civic, Gold Bar, Real Estate Property" />
                    </Form.Item>

                    <Form.Item
                      label="Purchase Year"
                      name={["details", "purchase_year"]}
                    >
                      <DatePicker
                        picker="year"
                        placeholder="Select Year"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Purchase Price"
                      name={["details", "purchase_price"]}
                      rules={[
                        {
                          pattern: /^[0-9]+(\.[0-9]+)?$/,
                          message: "Please enter a valid number",
                        },
                      ]}
                    >
                      <InputNumeric useCurrency step="any" />
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
                    Save Asset
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
